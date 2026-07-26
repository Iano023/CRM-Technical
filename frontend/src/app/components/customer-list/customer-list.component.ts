import { Component, OnInit } from '@angular/core';
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
  deleteSuccessMessage: string = '';

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe((data) => {
      this.customers = data;
    });
  }

  /**
   * Computed getter that filters customer list based on search term
   */
  get filteredCustomers(): Customer[] {
    const rawTerm = this.searchTerm.trim().toLowerCase();
    if (!rawTerm) {
      return this.customers;
    }

    // Split search into keywords so queries like "Albert Abarquez" or "Abarquez Albert" match
    const keywords = rawTerm.split(/\s+/);

    return this.customers.filter((c) => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      const reverseFullName = `${c.last_name} ${c.first_name}`.toLowerCase();
      const email = c.email.toLowerCase();
      const contact = c.contact_number.toLowerCase();

      // Check if all search keywords match somewhere in full name, email, or contact number
      return keywords.every(
        (kw) =>
          fullName.includes(kw) ||
          reverseFullName.includes(kw) ||
          email.includes(kw) ||
          contact.includes(kw)
      );
    });
  }

  /**
   * Delete customer with confirmation modal/dialog
   */
  onDelete(customer: Customer): void {
    const confirmed = confirm(
      `Are you sure you want to delete ${customer.first_name} ${customer.last_name}?`
    );

    if (confirmed) {
      this.customerService.deleteCustomer(customer.id).subscribe((success) => {
        if (success) {
          this.deleteSuccessMessage = `Customer ${customer.first_name} ${customer.last_name} deleted successfully!`;
          setTimeout(() => {
            this.deleteSuccessMessage = '';
          }, 3000);
        }
      });
    }
  }
}
