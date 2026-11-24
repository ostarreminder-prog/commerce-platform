import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import type { Media } from "@repo/contracts";
import { ImageCropDialog } from "../components/image-crop-dialog";
import { ImageField } from "../components/image-field";
import { MediaPicker } from "../components/media-picker";
import { toast } from "../components/toaster";

const meta: Meta = { title: "Media" };
export default meta;

const library: Media[] = [
  { id: "m1", url: "placeholder:30", altAr: "دهن عود", altEn: "Oud oil", width: 800, height: 800, mime: "image/png", sizeBytes: 182_000, createdAt: "2026-01-01T10:00:00Z" },
  { id: "m2", url: "placeholder:340", altAr: "تغليف هدايا", altEn: "Gift wrap", width: 800, height: 800, mime: "image/png", sizeBytes: 141_000, createdAt: "2026-01-02T10:00:00Z" },
  { id: "m3", url: "placeholder:200", altAr: "عناية شخصية", altEn: "Self care", width: 800, height: 800, mime: "image/png", sizeBytes: 149_000, createdAt: "2026-01-03T10:00:00Z" },
  { id: "m4", url: "placeholder:265", altAr: "أزياء", altEn: "Fashion", width: 800, height: 800, mime: "image/png", sizeBytes: 198_000, createdAt: "2026-01-04T10:00:00Z" },
];

const SAMPLE_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#c9d8f0"/><circle cx="400" cy="300" r="160" fill="#e8b26a"/><text x="400" y="320" font-size="64" text-anchor="middle" fill="#3a3a3a">800×600</text></svg>',
  );

function PickerDemo() {
  const [open, setOpen] = React.useState(true);
  return (
      <div className="p-6">
        <MediaPicker
          open={open}
          images={library}
          onUpload={() => toast.success("upload")}
          onSelect={(m) => {
            toast.success(`selected: ${m.id}`);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
        <button type="button" className="text-primary text-sm underline" onClick={() => setOpen(true)}>
          open
        </button>
      </div>
  );
}

export const Picker: StoryObj = { render: () => <PickerDemo /> };

function FieldDemo() {
  const [value, setValue] = React.useState<string>("placeholder:30");
  return (
      <div className="max-w-md p-6">
        <ImageField
          value={value}
          images={library}
          onSelect={(m) => setValue(m.url)}
          onUpload={() => toast.success("upload")}
          onCropResult={(d) => setValue(d)}
          onRemove={() => setValue("")}
        />
      </div>
  );
}

export const Field: StoryObj = { render: () => <FieldDemo /> };

function CropDemo() {
  const [open, setOpen] = React.useState(true);
  const [result, setResult] = React.useState<string | null>(null);
  return (
      <div className="p-6">
        <ImageCropDialog
          open={open}
          src={SAMPLE_SVG}
          onDone={(d) => {
            setResult(d);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
        <button type="button" className="text-primary text-sm underline" onClick={() => setOpen(true)}>
          open
        </button>
        {result ? <img src={result} alt="cropped" className="mt-4 w-40 rounded-lg border" /> : null}
      </div>
  );
}

export const Crop: StoryObj = { render: () => <CropDemo /> };
