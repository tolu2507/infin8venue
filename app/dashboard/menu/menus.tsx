/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
// app/dashboard/menu/MenuClient.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Package,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Safe helper
const getText = (json: any, fallback = "Unnamed") => {
  if (!json) return fallback;
  return json.en || fallback;
};

// Modifier Input Component
function ModifierInput({
  index,
  defaultValue,
}: {
  index: number;
  defaultValue?: any;
}) {
  const [name, setName] = useState(defaultValue?.name?.en || "");
  const [options, setOptions] = useState<string[]>(defaultValue?.options || []);
  const [currentOption, setCurrentOption] = useState("");

  const addOption = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentOption.trim()) {
      e.preventDefault();
      if (!options.includes(currentOption.trim())) {
        setOptions([...options, currentOption.trim()]);
      }
      setCurrentOption("");
    }
  };

  const removeOption = (opt: string) => {
    setOptions(options.filter((o:any) => o !== opt));
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-white">
      <Input
        placeholder="Modifier name (e.g., Spice Level)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div>
        <Input
          placeholder="Type option and press Enter (e.g., Mild)"
          value={currentOption}
          onChange={(e) => setCurrentOption(e.target.value)}
          onKeyDown={addOption}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {options.map((opt:any) => (
            <Badge key={opt} variant="secondary" className="px-3 py-1 text-sm">
              {opt}
              <button
                type="button"
                onClick={() => removeOption(opt)}
                className="ml-2 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Hidden inputs for form submission */}
      {name && options.length > 0 && (
        <>
          <input type="hidden" name={`modifier_name_${index}`} value={name} />
          <input
            type="hidden"
            name={`modifier_options_${index}`}
            value={options.join(",")}
          />
        </>
      )}
    </div>
  );
}

export default function MenuClient({
  categories,
  totalItems,
  activeItems,
}: any) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );

  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [openAddItem, setOpenAddItem] = useState<string | null>(null);
  const [openEditCategory, setOpenEditCategory] = useState<any>(null);
  const [openEditItem, setOpenEditItem] = useState<any>(null);

  const toggleDescription = (itemId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Add Category
  const addCategory = async (formData: FormData) => {
    setLoading("add-category");
    const name = formData.get("name") as string;

    const res = await fetch("/api/menu/category", {
      method: "POST",
      body: JSON.stringify({ name: { en: name } }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast.success("Category added");
      setOpenAddCategory(false);
      window.location.reload();
    } else {
      toast.error("Failed to add category");
    }
    setLoading(null);
  };

  // Add Item
  const addItem = async (formData: FormData) => {
    setLoading(`add-item-${openAddItem}`);

    // Build modifiers array
    const modifiers = [];
    for (let i = 0; i < 3; i++) {
      const name = formData.get(`modifier_name_${i}`) as string;
      const optionsStr = formData.get(`modifier_options_${i}`) as string;
      if (name && optionsStr) {
        modifiers.push({
          name: { en: name },
          options: optionsStr.split(","),
        });
      }
    }

    if (modifiers.length > 0) {
      formData.append("modifiers", JSON.stringify(modifiers));
    }

    const res = await fetch("/api/menu/item", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      toast.success("Item added");
      setOpenAddItem(null);
      window.location.reload();
    } else {
      toast.error("Failed to add item");
    }
    setLoading(null);
  };

  // Edit Category
  const editCategory = async (formData: FormData) => {
    setLoading(`edit-category-${openEditCategory.id}`);
    const name = formData.get("name") as string;

    const res = await fetch("/api/menu/category", {
      method: "PATCH",
      body: JSON.stringify({ id: openEditCategory.id, name: { en: name } }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast.success("Category updated");
      setOpenEditCategory(null);
      window.location.reload();
    } else {
      toast.error("Failed to update category");
    }
    setLoading(null);
  };

  // Edit Item
  const editItem = async (formData: FormData) => {
    setLoading(`edit-item-${openEditItem.id}`);

    // Build modifiers array
    const modifiers = [];
    for (let i = 0; i < 3; i++) {
      const name = formData.get(`modifier_name_${i}`) as string;
      const optionsStr = formData.get(`modifier_options_${i}`) as string;
      if (name && optionsStr) {
        modifiers.push({
          name: { en: name },
          options: optionsStr.split(","),
        });
      }
    }

    if (modifiers.length > 0) {
      formData.append("modifiers", JSON.stringify(modifiers));
    }

    const res = await fetch("/api/menu/item", {
      method: "PATCH",
      body: formData,
    });

    if (res.ok) {
      toast.success("Item updated");
      setOpenEditItem(null);
      window.location.reload();
    } else {
      toast.error("Failed to update item");
    }
    setLoading(null);
  };

  // Toggle Availability
  const toggleAvailability = async (itemId: string, current: boolean) => {
    setLoading(`toggle-${itemId}`);
    const res = await fetch("/api/menu/item", {
      method: "PATCH",
      body: JSON.stringify({ id: itemId, available: !current }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast.success("Availability updated");
      window.location.reload();
    } else {
      toast.error("Failed to update");
    }
    setLoading(null);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <Dialog open={openAddCategory} onOpenChange={setOpenAddCategory}>
            <DialogTrigger asChild>
              <Button disabled={loading === "add-category"}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <form action={addCategory} className="space-y-4">
                <div>
                  <Label>Name (English)</Label>
                  <Input name="name" required className="mt-2" />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading === "add-category"}>
                  {loading === "add-category" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Category"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="flex gap-8">
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-xl">✓</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold">{activeItems}</p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-10" />

      {/* Categories */}
      {categories.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <Package className="h-16 w-16 text-gray-400 mx-auto" />
            <h2 className="text-2xl font-semibold">No menu yet</h2>
            <p className="text-gray-600">
              Start building your menu by adding categories and items.
            </p>
            <Button onClick={() => setOpenAddCategory(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Add First Category
            </Button>
          </div>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-6">
          {categories.map((cat: any) => (
            <AccordionItem
              key={cat.id}
              value={cat.id}
              className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-6 py-4 bg-gray-50 hover:bg-gray-100">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-semibold text-left">
                      {getText(cat.name, "Unnamed Category")}
                    </h2>
                    <Badge variant="secondary">{cat.items.length} items</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Dialog
                      open={openEditCategory?.id === cat.id}
                      onOpenChange={(open) =>
                        setOpenEditCategory(open ? cat : null)
                      }>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loading?.startsWith("edit-category")}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Category</DialogTitle>
                        </DialogHeader>
                        <form action={editCategory} className="space-y-4">
                          <input type="hidden" name="id" value={cat.id} />
                          <div>
                            <Label>Name (English)</Label>
                            <Input
                              name="name"
                              defaultValue={getText(cat.name)}
                              required
                              className="mt-2"
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={loading === `edit-category-${cat.id}`}>
                            {loading === `edit-category-${cat.id}` ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={openAddItem === cat.id}
                      onOpenChange={(open) =>
                        setOpenAddItem(open ? cat.id : null)
                      }>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loading?.startsWith("add-item")}>
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Add New Item</DialogTitle>
                        </DialogHeader>
                        <form action={addItem} className="space-y-6">
                          <input
                            type="hidden"
                            name="categoryId"
                            value={cat.id}
                          />

                          <div>
                            <Label>Name</Label>
                            <Input name="name" required className="mt-2" />
                          </div>

                          <div>
                            <Label>Description</Label>
                            <Textarea name="description" className="mt-2" />
                          </div>

                          <div>
                            <Label>Price</Label>
                            <Input
                              name="price"
                              type="number"
                              step="0.01"
                              required
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label>Image</Label>
                            <Input
                              type="file"
                              name="image"
                              accept="image/*"
                              className="mt-2"
                            />
                          </div>

                          {/* Smart Modifiers */}
                          <div className="space-y-4">
                            <Label>Modifiers (e.g., Spice Level, Extras)</Label>
                            <div className="space-y-6">
                              <ModifierInput index={0} />
                              <ModifierInput index={1} />
                              <ModifierInput index={2} />
                            </div>
                          </div>

                          <Button
                            type="submit"
                            className="w-full"
                            disabled={loading === `add-item-${cat.id}`}>
                            {loading === `add-item-${cat.id}` ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add Item"
                            )}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 bg-white">
                {cat.items.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No items in this category yet
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cat.items.map((item: any) => {
                      const description =
                        getText(item.description) || "No description";
                      const isExpanded = expandedDescriptions.has(item.id);
                      const shouldTruncate = description.length > 70;

                      return (
                        <Card
                          key={item.id}
                          className="overflow-hidden flex flex-col h-full">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={getText(item.name)}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="bg-gray-200 h-48 border-2 border-dashed rounded-t-xl" />
                          )}
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">
                                {getText(item.name)}
                              </CardTitle>
                              <Badge
                                variant={
                                  item.available ? "default" : "secondary"
                                }>
                                {item.available ? "Available" : "Unavailable"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-gray-600 text-sm mb-4">
                                <span
                                  className={` ${
                                    isExpanded ? "" : "line-clamp-3"
                                  } `}>
                                  {description}
                                </span>
                                {shouldTruncate && (
                                  <button
                                    onClick={() => toggleDescription(item.id)}
                                    className="text-blue-600 text-sm font-medium ml-2">
                                    {isExpanded ? (
                                      <>
                                        Less{" "}
                                        <ChevronUp className="inline h-4 w-4" />
                                      </>
                                    ) : (
                                      <>
                                        More{" "}
                                        <ChevronDown className="inline h-4 w-4" />
                                      </>
                                    )}
                                  </button>
                                )}
                              </p>
                            </div>
                            <div className="mt-6 flex justify-between items-center">
                              <p className="text-2xl font-bold text-green-600">
                                ${Number(item.price).toFixed(2)}
                              </p>
                              <div className="flex gap-2">
                                <Dialog
                                  open={openEditItem?.id === item.id}
                                  onOpenChange={(open) =>
                                    setOpenEditItem(open ? item : null)
                                  }>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={loading?.startsWith(
                                        "edit-item"
                                      )}>
                                      Edit
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>Edit Item</DialogTitle>
                                    </DialogHeader>
                                    <form
                                      action={editItem}
                                      className="space-y-6">
                                      <input
                                        type="hidden"
                                        name="id"
                                        value={item.id}
                                      />

                                      <div>
                                        <Label>Name</Label>
                                        <Input
                                          name="name"
                                          defaultValue={getText(item.name)}
                                          required
                                          className="mt-2"
                                        />
                                      </div>

                                      <div>
                                        <Label>Description</Label>
                                        <Textarea
                                          name="description"
                                          defaultValue={getText(
                                            item.description
                                          )}
                                          className="mt-2"
                                        />
                                      </div>

                                      <div>
                                        <Label>Price</Label>
                                        <Input
                                          name="price"
                                          type="number"
                                          step="0.01"
                                          defaultValue={Number(item.price)}
                                          required
                                          className="mt-2"
                                        />
                                      </div>

                                      <div>
                                        <Label>Image</Label>
                                        <Input
                                          type="file"
                                          name="image"
                                          accept="image/*"
                                          className="mt-2"
                                        />
                                      </div>

                                      {/* Smart Modifiers */}
                                      <div className="space-y-4">
                                        <Label>Modifiers</Label>
                                        <div className="space-y-6">
                                          {item.modifiers?.length > 0 ? (
                                            item.modifiers.map(
                                              (mod: any, i: number) => (
                                                <ModifierInput
                                                  key={i}
                                                  index={i}
                                                  defaultValue={mod}
                                                />
                                              )
                                            )
                                          ) : (
                                            <>
                                              <ModifierInput index={0} />
                                              <ModifierInput index={1} />
                                              <ModifierInput index={2} />
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={
                                          loading === `edit-item-${item.id}`
                                        }>
                                        {loading === `edit-item-${item.id}` ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                          </>
                                        ) : (
                                          "Save Changes"
                                        )}
                                      </Button>
                                    </form>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleAvailability(item.id, item.available)
                                  }
                                  disabled={loading === `toggle-${item.id}`}>
                                  {loading === `toggle-${item.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Toggle"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
