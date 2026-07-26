import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css'],
})
export class CustomerFormComponent implements OnInit {
  customerForm!: FormGroup;
  isEditMode: boolean = false;
  customerId: number | null = null;
  loading: boolean = false;
  submitting: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    // Initialize Reactive Form with validation rules
    this.customerForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      contact_number: ['', [Validators.required, Validators.pattern(/^[0-9+--\s()]{7,15}$/)]],
    });

    // Determine if we are in Create mode or Edit mode based on URL parameter
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.customerId = Number(idParam);
      this.loadCustomerData(this.customerId);
    }
  }

  /**
   * Helper getter to access form controls easily in template
   */
  get f() {
    return this.customerForm.controls;
  }

  loadCustomerData(id: number): void {
    this.loading = true;
    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
        if (customer) {
          this.customerForm.patchValue({
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            contact_number: customer.contact_number,
          });
        } else {
          this.errorMessage = `Customer #${id} not found.`;
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load customer data.';
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      // Mark all fields as touched to trigger Bootstrap validation styling
      this.customerForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.customerForm.value;

    if (this.isEditMode && this.customerId) {
      // Edit Customer logic
      this.customerService.updateCustomer(this.customerId, formData).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/customers']);
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to update customer.';
          this.submitting = false;
        },
      });
    } else {
      // Create Customer logic
      this.customerService.addCustomer(formData).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/customers']);
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to create customer.';
          this.submitting = false;
        },
      });
    }
  }
}
