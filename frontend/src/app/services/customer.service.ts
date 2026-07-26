import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Customer } from '../models/customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  // Initial mock customer dataset as required by specifications
  private mockCustomers: Customer[] = [
    {
      id: 1,
      first_name: 'Albert',
      last_name: 'Abarquez',
      email: 'albert@email.com',
      contact_number: '09123456789',
    },
    {
      id: 2,
      first_name: 'Maria',
      last_name: 'Santos',
      email: 'maria.santos@email.com',
      contact_number: '09987654321',
    },
    {
      id: 3,
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      email: 'juan.delacruz@email.com',
      contact_number: '09171234567',
    },
  ];

  private customers$ = new BehaviorSubject<Customer[]>(this.mockCustomers);

  /**
   * Get all customers as an Observable stream
   */
  getCustomers(): Observable<Customer[]> {
    return this.customers$.asObservable();
  }

  /**
   * Get a single customer by ID
   */
  getCustomerById(id: number): Observable<Customer | undefined> {
    const customer = this.mockCustomers.find((c) => c.id === id);
    return of(customer);
  }

  /**
   * Add a new customer
   */
  addCustomer(customerData: Omit<Customer, 'id'>): Observable<Customer> {
    const nextId = this.mockCustomers.length > 0 
      ? Math.max(...this.mockCustomers.map((c) => c.id)) + 1 
      : 1;

    const newCustomer: Customer = {
      id: nextId,
      ...customerData,
    };

    this.mockCustomers = [...this.mockCustomers, newCustomer];
    this.customers$.next(this.mockCustomers);
    return of(newCustomer);
  }

  /**
   * Update an existing customer
   */
  updateCustomer(id: number, updatedData: Partial<Customer>): Observable<Customer> {
    const index = this.mockCustomers.findIndex((c) => c.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Customer with ID ${id} not found.`));
    }

    const updatedCustomer: Customer = {
      ...this.mockCustomers[index],
      ...updatedData,
      id, // Preserve ID
    };

    this.mockCustomers[index] = updatedCustomer;
    this.mockCustomers = [...this.mockCustomers];
    this.customers$.next(this.mockCustomers);
    return of(updatedCustomer);
  }

  /**
   * Delete a customer by ID
   */
  deleteCustomer(id: number): Observable<boolean> {
    const initialLength = this.mockCustomers.length;
    this.mockCustomers = this.mockCustomers.filter((c) => c.id !== id);
    this.customers$.next(this.mockCustomers);
    return of(this.mockCustomers.length < initialLength);
  }
}
