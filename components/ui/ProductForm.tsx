"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { useRouter } from "next/navigation";

interface ProductFormProps {
  initialData?: {
    id?: number;
    item_imei: string | null;
    item_tac: string | null;
    item_color: string | null;
    item_grade: number | null;
    item_gb: string | null;
    purchase_id: number | null;
    status: number | null;
    unit_confirmed: number | null;
  };
}

export function ProductForm({ initialData }: ProductFormProps) {
  const [formData, setFormData] = useState({
    item_imei: initialData?.item_imei || "",
    item_tac: initialData?.item_tac || "",
    item_color: initialData?.item_color || "",
    item_grade: initialData?.item_grade || 0,
    item_gb: initialData?.item_gb || "",
    purchase_id: initialData?.purchase_id || null,
    status: initialData?.status || 0,
    unit_confirmed: initialData?.unit_confirmed || null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (initialData?.id) {
        await axios.put(`/api/inventory/imei/${initialData.id}`, formData);
      } else {
        await axios.post("/api/inventory/imei", formData);
      }
      router.push("/inventory/imei");
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{initialData?.id ? "Edit IMEI Item" : "Add IMEI Item"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="IMEI"
              value={formData.item_imei}
              onChange={(e) => setFormData({ ...formData, item_imei: e.target.value })}
              required
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="TAC"
              value={formData.item_tac}
              onChange={(e) => setFormData({ ...formData, item_tac: e.target.value })}
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="Color"
              value={formData.item_color}
              onChange={(e) => setFormData({ ...formData, item_color: e.target.value })}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Grade"
              value={formData.item_grade}
              onChange={(e) => setFormData({ ...formData, item_grade: parseInt(e.target.value) })}
              min="0"
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="Storage (GB)"
              value={formData.item_gb}
              onChange={(e) => setFormData({ ...formData, item_gb: e.target.value })}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Purchase ID"
              value={formData.purchase_id || ""}
              onChange={(e) => setFormData({ ...formData, purchase_id: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Status (0 = Out of Stock, 1 = In Stock)"
              value={formData.status || ""}
              onChange={(e) => setFormData({ ...formData, status: e.target.value ? parseInt(e.target.value) : null })}
              min="0"
              max="1"
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Unit Confirmed"
              value={formData.unit_confirmed || ""}
              onChange={(e) => setFormData({ ...formData, unit_confirmed: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : initialData?.id ? "Update Item" : "Add Item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
