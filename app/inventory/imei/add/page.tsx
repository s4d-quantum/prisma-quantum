"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";

export default function AddImeiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_imei: "",
    item_tac: "",
    item_color: "",
    item_grade: "1",
    item_gb: "",
    purchase_id: "",
    status: "1"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item_imei || !formData.item_tac) {
      alert("IMEI and TAC are required fields");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/api/inventory/imei", formData);
      
      alert("IMEI product added successfully!");
      router.push("/inventory");
    } catch (error: any) {
      console.error("Error adding IMEI product:", error);
      
      if (error.response?.status === 409) {
        alert("This IMEI already exists in the system");
      } else {
        alert("Failed to add IMEI product. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New IMEI Product</h1>
        <p className="text-gray-600">Enter the details for the new IMEI product</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_imei">IMEI *</Label>
                <Input
                  id="item_imei"
                  name="item_imei"
                  value={formData.item_imei}
                  onChange={handleInputChange}
                  placeholder="Enter IMEI number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item_tac">TAC *</Label>
                <Input
                  id="item_tac"
                  name="item_tac"
                  value={formData.item_tac}
                  onChange={handleInputChange}
                  placeholder="Enter TAC number"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_color">Color</Label>
                <Input
                  id="item_color"
                  name="item_color"
                  value={formData.item_color}
                  onChange={handleInputChange}
                  placeholder="e.g., Black, White, Blue"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item_gb">Storage</Label>
                <Input
                  id="item_gb"
                  name="item_gb"
                  value={formData.item_gb}
                  onChange={handleInputChange}
                  placeholder="e.g., 64GB, 128GB, 256GB"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_grade">Grade</Label>
                <select
                  id="item_grade"
                  name="item_grade"
                  value={formData.item_grade}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="1">Grade A (Excellent)</option>
                  <option value="2">Grade B (Good)</option>
                  <option value="3">Grade C (Fair)</option>
                  <option value="4">Grade D (Poor)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="1">In Stock</option>
                  <option value="2">Reserved</option>
                  <option value="0">Out of Stock</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_id">Purchase ID (Optional)</Label>
              <Input
                id="purchase_id"
                name="purchase_id"
                type="number"
                value={formData.purchase_id}
                onChange={handleInputChange}
                placeholder="Enter purchase ID if applicable"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Adding..." : "Add IMEI Product"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push("/inventory")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
