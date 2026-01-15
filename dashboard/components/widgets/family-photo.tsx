"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
  Heart,
  Calendar,
  Play,
  Pause,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FamilyPhoto {
  id: string;
  url: string;
  caption?: string;
  date: Date;
  isLiked: boolean;
}

// Sample photos - in production this would come from your photo storage
const samplePhotos: FamilyPhoto[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop",
    caption: "Beach vacation 2024",
    date: new Date(2024, 6, 15),
    isLiked: true,
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=300&fit=crop",
    caption: "Christmas morning",
    date: new Date(2024, 11, 25),
    isLiked: true,
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop",
    caption: "Park picnic",
    date: new Date(2024, 4, 10),
    isLiked: false,
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=400&h=300&fit=crop",
    caption: "Family game night",
    date: new Date(2024, 9, 5),
    isLiked: true,
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1517554558809-9b4971b38f39?w=400&h=300&fit=crop",
    caption: "Backyard BBQ",
    date: new Date(2024, 7, 20),
    isLiked: false,
  },
];

function formatPhotoDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function FamilyPhotoWidget() {
  const [photos, setPhotos] = useState<FamilyPhoto[]>(samplePhotos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPhoto = photos[currentIndex];

  // Auto-advance slideshow
  useEffect(() => {
    if (!isPlaying || isHovered || photos.length <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, isHovered, currentIndex, photos.length]);

  const goToPrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
      setIsTransitioning(false);
    }, 200);
  };

  const goToNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
      setIsTransitioning(false);
    }, 200);
  };

  const toggleLike = () => {
    setPhotos(
      photos.map((photo, index) =>
        index === currentIndex ? { ...photo, isLiked: !photo.isLiked } : photo
      )
    );
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // In production, you would upload to storage and add to photos
      console.log("Files selected:", files);
    }
  };

  const goToPhoto = (index: number) => {
    if (index !== currentIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 200);
    }
  };

  if (photos.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/50">
              <ImageIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <CardTitle className="text-lg">Family Photos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">No photos yet</p>
            <Button onClick={handleUpload} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload First Photo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/50">
            <ImageIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <CardTitle className="text-lg">Family Photos</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleUpload}>
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Photo Display */}
        <div
          className="relative aspect-[4/3] bg-muted overflow-hidden group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Photo */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300",
              isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
            )}
          >
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || "Family photo"}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Gradient overlay for text */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 hover:scale-110"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 hover:scale-110"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Photo info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                {currentPhoto.caption && (
                  <p className="font-medium text-sm drop-shadow-lg">
                    {currentPhoto.caption}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs opacity-80 mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatPhotoDate(currentPhoto.date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLike}
                  className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-all hover:scale-110"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-all",
                      currentPhoto.isLiked
                        ? "fill-red-500 text-red-500"
                        : "text-white"
                    )}
                  />
                </button>
                <button className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-all hover:scale-110">
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Slideshow progress indicator */}
          {isPlaying && photos.length > 1 && (
            <div className="absolute top-2 left-2 right-2">
              <div className="flex gap-1">
                {photos.map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-1 rounded-full overflow-hidden bg-white/30"
                  >
                    <div
                      className={cn(
                        "h-full bg-white rounded-full",
                        index === currentIndex ? "animate-progress" : "",
                        index < currentIndex ? "w-full" : "w-0"
                      )}
                      style={{
                        animation:
                          index === currentIndex
                            ? "progress 5s linear"
                            : "none",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="p-3 bg-muted/30 border-t">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => goToPhoto(index)}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                    index === currentIndex
                      ? "border-rose-500 ring-2 ring-rose-500/30 scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Memory Lane button */}
        <div className="p-3 border-t">
          <Button variant="outline" className="w-full gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30">
            <ImageIcon className="h-4 w-4" />
            Memory Lane
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </CardContent>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </Card>
  );
}
