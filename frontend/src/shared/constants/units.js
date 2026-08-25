// Full set of trade units offered across the product/inventory add forms.
// Existing values (piece, kg, gm, ml, ltr, watt, mtr, ft, sqft, box, bundle, pack)
// are kept as-is so previously saved products/inventory keep rendering correctly.
export const UNIT_GROUPS = [
  {
    label: "Count / Packaging",
    options: [
      { value: "piece", label: "Pieces (PCS)" },
      { value: "set", label: "Set" },
      { value: "pair", label: "Pair" },
      { value: "pack", label: "Pack" },
      { value: "box", label: "Box" },
      { value: "carton", label: "Carton" },
      { value: "bundle", label: "Bundle" },
      { value: "bag", label: "Bag" },
      { value: "roll", label: "Roll" },
      { value: "sheet", label: "Sheet" },
      { value: "panel", label: "Panel" },
      { value: "slab", label: "Slab" },
    ],
  },
  {
    label: "Weight",
    options: [
      { value: "gm", label: "Gram (g)" },
      { value: "kg", label: "Kilogram (kg)" },
      { value: "quintal", label: "Quintal" },
      { value: "metric_ton", label: "Metric Ton" },
    ],
  },
  {
    label: "Length",
    options: [
      { value: "mm", label: "Millimeter (mm)" },
      { value: "cm", label: "Centimeter (cm)" },
      { value: "mtr", label: "Meter (m)" },
      { value: "ft", label: "Feet (ft)" },
      { value: "inch", label: "Inch (in)" },
      { value: "yard", label: "Yard (yd)" },
    ],
  },
  {
    label: "Area",
    options: [
      { value: "sqft", label: "Sq. Ft." },
      { value: "sqm", label: "Sq. M." },
      { value: "sqyd", label: "Sq. Yd." },
    ],
  },
  {
    label: "Volume / Liquid",
    options: [
      { value: "ml", label: "Millilitre (ml)" },
      { value: "ltr", label: "Litre (L)" },
      { value: "cft", label: "CFT" },
      { value: "cbm", label: "CBM" },
    ],
  },
  {
    label: "Other / Logistics",
    options: [
      { value: "rft", label: "RFT (Running Ft)" },
      { value: "rm", label: "RM (Running Meter)" },
      { value: "brass", label: "Brass" },
      { value: "truck_load", label: "Truck Load" },
      { value: "tipper_load", label: "Tipper Load" },
      { value: "watt", label: "Watt (W)" },
    ],
  },
];

export const ALL_UNITS = UNIT_GROUPS.flatMap((group) => group.options);

export const getUnitLabel = (value) =>
  ALL_UNITS.find((opt) => opt.value === value)?.label || value;
