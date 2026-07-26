import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-delete-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './delete-confirmation.component.html',
  styleUrls: ['./delete-confirmation.component.css']
})
export class DeleteConfirmationComponent implements OnInit {
  customer: Customer | null = null;
  loading: boolean = true;
  deleting: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;

    if (id) {
      this.customerService.getCustomerById(id).subscribe({
        next: (data) => {
          if (data) {
            this.customer = data;
          } else {
            this.errorMessage = `Customer #${id} not found.`;
          }
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load customer details.';
          this.loading = false;
        }
      });
    } else {
      this.errorMessage = 'Invalid Customer ID.';
      this.loading = false;
    }
  }

  confirmDelete(): void {
    if (!this.customer) return;

    this.deleting = true;
    this.customerService.deleteCustomer(this.customer.id).subscribe({
      next: (success) => {
        this.deleting = false;
        if (success) {
          this.router.navigate(['/customers'], {
            queryParams: { deleted: this.customer?.id }
          });
        } else {
          this.errorMessage = 'Failed to delete customer.';
        }
      },
      error: () => {
        this.deleting = false;
        this.errorMessage = 'Error occurred while deleting customer.';
      }
    });
  }
}
