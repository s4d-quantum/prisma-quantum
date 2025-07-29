"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";

interface Item {
  id: number;
  item_imei: string | null;
  item_tac: string | null;
  item_color: string | null;
  item_grade: number | null;
  item_gb: string | null;
  purchase_id: number | null;
  status: number | null;
}

interface ImeiProductTableProps {
  items: Item[];
  onDelete: (id: number) => void;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export function ImeiProductTable({ items, onDelete, page, totalPages, setPage }: ImeiProductTableProps) {
  const router = useRouter();

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IMEI</TableHead>
            <TableHead>TAC</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Storage (GB)</TableHead>
            <TableHead>Purchase ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.item_imei || "N/A"}</TableCell>
              <TableCell>{item.item_tac || "N/A"}</TableCell>
              <TableCell>{item.item_color || "N/A"}</TableCell>
              <TableCell>{item.item_grade !== null ? item.item_grade : "N/A"}</TableCell>
              <TableCell>{item.item_gb || "N/A"}</TableCell>
              <TableCell>{item.purchase_id || "N/A"}</TableCell>
              <TableCell>{item.status !== null ? (item.status === 1 ? "In Stock" : "Out of Stock") : "N/A"}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => router.push(`/inventory/imei/edit/${item.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDelete(item.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <span>Page {page} of {totalPages}</span>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
