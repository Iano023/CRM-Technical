import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  deleteSuccessMessage: string = '';
  errorMessage: string = '';

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  /**
   * Fetch customers list from backend REST API
   */
  loadCustomers(search?: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.customerService.getCustomers(search).subscribe({
      next: (data) => {
        this.customers = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load customers from API', err);
        this.errorMessage = 'Unable to connect to backend API. Please make sure Laravel is running.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Trigger search query against backend API
   */
  onSearchChange(): void {
    this.loadCustomers(this.searchTerm);
  }

  /**
   * Clear search filter
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.loadCustomers();
  }

  /**
   * Getter for displaying customers
   */
  get filteredCustomers(): Customer[] {
    return this.customers;
  }

  /**
   * Delete customer with confirmation dialog
   */
  onDelete(customer: Customer): void {
    const confirmed = confirm(
      `Are you sure you want to delete ${customer.first_name} ${customer.last_name}?`
    );

    if (confirmed) {
      this.customerService.deleteCustomer(customer.id).subscribe({
        next: () => {
          this.deleteSuccessMessage = `Customer ${customer.first_name} ${customer.last_name} deleted successfully!`;
          this.loadCustomers(this.searchTerm);
          setTimeout(() => {
            this.deleteSuccessMessage = '';
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (err) => {
          console.error('Failed to delete customer', err);
          alert('Failed to delete customer. Please try again.');
        }
      });
    }
  }
}
