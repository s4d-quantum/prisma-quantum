"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";

interface Customer {
  id: number;
  customer_id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  postcode: string;
  vat: string;
}

interface ApiResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Add customer form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    name: "",
    address: "",
    phone: "",
    email: "",
    city: "",
    country: "",
    postcode: "",
    vat: ""
  });

  useEffect(() => {
    fetchCustomers();
  }, [router, currentPage, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm })
      });

      const response = await axios.get(`/api/customers?${params}`);
      const data: ApiResponse = response.data;
      
      setCustomers(data.customers);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.name) {
      alert("Customer ID and name are required");
      return;
    }

    try {
      await axios.post("/api/customers", formData);
      alert("Customer added successfully!");
      
      // Reset form and refetch customers
      setFormData({
        customer_id: "",
        name: "",
        address: "",
        phone: "",
        email: "",
        city: "",
        country: "",
        postcode: "",
        vat: ""
      });
      setShowAddForm(false);
      fetchCustomers();
    } catch (error: any) {
      console.error("Error adding customer:", error);
      if (error.response?.status === 409) {
        alert("Customer ID already exists");
      } else {
        alert("Failed to add customer");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add New Customer"}
        </Button>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="customer_id"
                  placeholder="Customer ID *"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  name="name"
                  placeholder="Customer Name *"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <Input
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <Input
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                />
                <Input
                  name="postcode"
                  placeholder="Postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                />
                <Input
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleInputChange}
                />
              </div>
              <Input
                name="vat"
                placeholder="VAT Number"
                value={formData.vat}
                onChange={handleInputChange}
              />
              <Button type="submit">Add Customer</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              placeholder="Search by name, ID, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
                fetchCustomers();
              }}
            >
              Clear
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {customers.length} of {totalCount} customers
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-mono text-sm">
                    {customer.customer_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {customer.name}
                  </TableCell>
                  <TableCell>{customer.email || "N/A"}</TableCell>
                  <TableCell>{customer.phone || "N/A"}</TableCell>
                  <TableCell>{customer.city || "N/A"}</TableCell>
                  <TableCell>{customer.country || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        View Orders
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
