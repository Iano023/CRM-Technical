import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css']
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  loading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    // Read route parameter 'id' from URL /customers/:id
    const idParam = this.route.snapshot.paramMap.get('id');
    const customerId = idParam ? Number(idParam) : null;

    if (customerId) {
      this.customerService.getCustomerById(customerId).subscribe({
        next: (data) => {
          if (data) {
            this.customer = data;
          } else {
            this.error = `Customer with ID #${customerId} was not found.`;
          }
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load customer details.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Invalid Customer ID.';
      this.loading = false;
    }
  }

  onDelete(): void {
    if (!this.customer) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${this.customer.first_name} ${this.customer.last_name}?`
    );

    if (confirmed) {
      this.customerService.deleteCustomer(this.customer.id).subscribe((success) => {
        if (success) {
          this.router.navigate(['/customers']);
        }
      });
    }
  }
}
