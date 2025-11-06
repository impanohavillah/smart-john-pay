import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Video, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Camera {
  id: string;
  name: string;
  url: string;
}

// Secure camera URL validation schema
const cameraUrlSchema = z.string()
  .trim()
  .min(1, "URL cannot be empty")
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'rtsp:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, "Invalid URL format. Only HTTP, HTTPS, and RTSP protocols are allowed")
  .refine((url) => {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;
      // Block private IP ranges for security (prevents SSRF attacks)
      const privateIpPattern = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.0\.0\.1|localhost)/;
      return !privateIpPattern.test(hostname);
    } catch {
      return false;
    }
  }, "Private IP addresses are not allowed for security reasons");

const cameraNameSchema = z.string()
  .trim()
  .min(1, "Camera name cannot be empty")
  .max(100, "Camera name must be less than 100 characters");

export default function CameraView() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [newCameraName, setNewCameraName] = useState("");
  const [newCameraUrl, setNewCameraUrl] = useState("");

  const addCamera = () => {
    if (!newCameraName.trim() || !newCameraUrl.trim()) {
      toast.error("Please enter both camera name and IP address/URL");
      return;
    }

    // Validate camera name
    const nameValidation = cameraNameSchema.safeParse(newCameraName);
    if (!nameValidation.success) {
      toast.error(nameValidation.error.errors[0].message);
      return;
    }

    // Validate camera URL
    const urlValidation = cameraUrlSchema.safeParse(newCameraUrl);
    if (!urlValidation.success) {
      toast.error(urlValidation.error.errors[0].message);
      return;
    }

    const newCamera: Camera = {
      id: Date.now().toString(),
      name: nameValidation.data,
      url: urlValidation.data,
    };

    setCameras([...cameras, newCamera]);
    setNewCameraName("");
    setNewCameraUrl("");
    toast.success("Camera added successfully");
  };

  const removeCamera = (id: string) => {
    setCameras(cameras.filter(cam => cam.id !== id));
    toast.success("Camera removed");
  };

  const refreshCamera = (id: string) => {
    const iframe = document.getElementById(`camera-${id}`) as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
      toast.success("Camera feed refreshed");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Camera Feed</CardTitle>
          <CardDescription>Connect to IP cameras or video streams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="camera-name">Camera Name</Label>
              <Input
                id="camera-name"
                placeholder="e.g., Main Entrance"
                value={newCameraName}
                onChange={(e) => setNewCameraName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="camera-url">Camera IP/URL</Label>
              <Input
                id="camera-url"
                placeholder="e.g., http://192.168.1.100:8080/video or rtsp://..."
                value={newCameraUrl}
                onChange={(e) => setNewCameraUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the camera's IP address with port, RTSP URL, or HTTP video stream URL
              </p>
            </div>
            <Button onClick={addCamera} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Camera
            </Button>
          </div>
        </CardContent>
      </Card>

      {cameras.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No cameras connected yet. Add a camera feed above to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cameras.map((camera) => (
            <Card key={camera.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{camera.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refreshCamera(camera.id)}
                    title="Refresh feed"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCamera(camera.id)}
                    title="Remove camera"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe
                    id={`camera-${camera.id}`}
                    src={camera.url}
                    className="absolute inset-0 w-full h-full"
                    title={camera.name}
                    allowFullScreen
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  {camera.url}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
