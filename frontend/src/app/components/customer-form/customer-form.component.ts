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
import { HttpErrorResponse } from '@angular/common/http';

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
  apiErrors: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    // Initialize Reactive Form with validation rules
    this.customerForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      contact_number: [''],
    });

    // Determine if we are in Create mode or Edit mode based on URL parameter
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.customerId = Number(idParam);
      this.loadCustomerData(this.customerId);
    }
  }

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
            contact_number: customer.contact_number || '',
          });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading customer:', err);
        this.errorMessage = 'Failed to load customer record from server.';
        this.loading = false;
      },
    });
  }

  private handleApiError(err: HttpErrorResponse): void {
    this.submitting = false;
    if (err.status === 422 && err.error?.errors) {
      this.apiErrors = err.error.errors;
      this.errorMessage = err.error.message || 'Validation error occurred. Please check the fields below.';

      // Apply field-specific errors to form controls
      Object.keys(err.error.errors).forEach((field) => {
        const control = this.customerForm.get(field);
        if (control) {
          control.setErrors({ serverError: err.error.errors[field].join(' ') });
        }
      });
    } else {
      this.errorMessage = err.error?.message || 'An unexpected error occurred while communicating with the server.';
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.apiErrors = {};

    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.customerForm.value;

    if (this.isEditMode && this.customerId) {
      this.customerService.updateCustomer(this.customerId, formData).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/customers']);
        },
        error: (err: HttpErrorResponse) => this.handleApiError(err),
      });
    } else {
      this.customerService.addCustomer(formData).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/customers']);
        },
        error: (err: HttpErrorResponse) => this.handleApiError(err),
      });
    }
  }
}
