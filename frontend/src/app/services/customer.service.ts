import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Customer } from '../models/customer.model';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  // Base URL sourced from environment config (src/environments/environment.ts)
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all customers from Laravel API, supporting real-time search queries
   */
  getCustomers(search?: string): Observable<Customer[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<Customer[]>(this.apiUrl, { params });
  }

  /**
   * Get a single customer by ID
   */
  getCustomerById(id: number): Observable<Customer> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Add a new customer record via POST
   */
  addCustomer(customerData: Omit<Customer, 'id'>): Observable<Customer> {
    return this.http.post<ApiResponse<Customer>>(this.apiUrl, customerData).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Update an existing customer via PUT
   */
  updateCustomer(id: number, updatedData: Partial<Customer>): Observable<Customer> {
    return this.http.put<ApiResponse<Customer>>(`${this.apiUrl}/${id}`, updatedData).pipe(
      map((response) => response.data)
    );
  }

  /**
   * Delete a customer by ID via DELETE
   */
  deleteCustomer(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`).pipe(
      map(() => true)
    );
  }
}
