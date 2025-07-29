"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";

interface ImeiProduct {
  id: number;
  item_imei: string;
  item_tac: string;
  item_color: string;
  item_grade: number;
  item_gb: string;
  purchase_id: number;
  status: number;
  unit_confirmed: number;
  created_at: Date;
  tacDetails?: {
    item_brand: string;
    item_details: string;
  };
}

interface ApiResponse {
  products: ImeiProduct[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ImeiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [router, currentPage, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm })
      });

      const response = await axios.get(`/api/inventory/imei?${params}`);
      const data: ApiResponse = response.data;
      
      setProducts(data.products);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">In Stock</span>;
      case 2:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Reserved</span>;
      case 0:
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Out of Stock</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Unknown</span>;
    }
  };

  const getGradeBadge = (grade: number) => {
    const gradeLabels: { [key: number]: string } = {
      1: "Grade A",
      2: "Grade B", 
      3: "Grade C",
      4: "Grade D"
    };
    
    const gradeColors: { [key: number]: string } = {
      1: "bg-blue-100 text-blue-800",
      2: "bg-green-100 text-green-800",
      3: "bg-yellow-100 text-yellow-800",
      4: "bg-red-100 text-red-800"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${gradeColors[grade] || "bg-gray-100 text-gray-800"}`}>
        {gradeLabels[grade] || `Grade ${grade}`}
      </span>
    );
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">IMEI Inventory</h1>
        <p className="text-gray-600">View current inventory levels and product details</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              placeholder="Search by IMEI, TAC, Color, or GB..."
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
                fetchProducts();
              }}
            >
              Clear
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {products.length} of {totalCount} products
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IMEI</TableHead>
                <TableHead>Brand/Model</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">
                    {product.item_imei}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {product.tacDetails?.item_brand || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.tacDetails?.item_details || product.item_tac}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.item_color || "N/A"}</TableCell>
                  <TableCell>{getGradeBadge(product.item_grade)}</TableCell>
                  <TableCell>{product.item_gb || "N/A"}</TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell>{product.purchase_id || "N/A"}</TableCell>
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
