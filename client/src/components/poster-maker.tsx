import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Palette, Download, Eye, Printer, Share2 } from 'lucide-react';

interface PosterTemplate {
  id: string;
  name: string;
  category: string;
  bgColor: string;
  textColor: string;
  layout: string;
}

export default function PosterMaker() {
  const [activeTemplate, setActiveTemplate] = useState<PosterTemplate | null>(null);
  const [posterData, setPosterData] = useState({
    title: '',
    subtitle: '',
    description: '',
    price: '',
    validUntil: '',
    contactInfo: '',
    logo: null as File | null
  });
  const [previewMode, setPreviewMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates: PosterTemplate[] = [
    {
      id: 'sale-special',
      name: 'Special Offer',
      category: 'sales',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      layout: 'center'
    },
    {
      id: 'new-product',
      name: 'New Product Launch',
      category: 'product',
      bgColor: 'bg-blue-600',
      textColor: 'text-white',
      layout: 'side'
    },
    {
      id: 'event-promo',
      name: 'Event Promotion',
      category: 'event',
      bgColor: 'bg-green-600',
      textColor: 'text-white',
      layout: 'top'
    },
    {
      id: 'discount-offer',
      name: '% Discount',
      category: 'sales',
      bgColor: 'bg-orange-500',
      textColor: 'text-white',
      layout: 'split'
    },
    {
      id: 'happy-hour',
      name: 'Happy Hour (Pub)',
      category: 'hospitality',
      bgColor: 'bg-amber-600',
      textColor: 'text-white',
      layout: 'center'
    },
    {
      id: 'fresh-daily',
      name: 'Fresh Daily (Bakery)',
      category: 'food',
      bgColor: 'bg-yellow-400',
      textColor: 'text-black',
      layout: 'side'
    }
  ];

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPosterData({ ...posterData, logo: file });
    }
  };

  const generatePosterCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeTemplate) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (A4 poster size)
    canvas.width = 595;
    canvas.height = 842;

    // Clear canvas
    ctx.fillStyle = activeTemplate.bgColor.replace('bg-', '#');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add text content based on template layout
    ctx.fillStyle = activeTemplate.textColor === 'text-white' ? '#FFFFFF' : '#000000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(posterData.title || 'Your Title Here', canvas.width / 2, 150);

    ctx.font = '32px Arial';
    ctx.fillText(posterData.subtitle || 'Subtitle', canvas.width / 2, 200);

    ctx.font = '24px Arial';
    ctx.fillText(posterData.description || 'Description goes here', canvas.width / 2, 300);

    if (posterData.price) {
      ctx.font = 'bold 72px Arial';
      ctx.fillText(`€${posterData.price}`, canvas.width / 2, 450);
    }

    if (posterData.validUntil) {
      ctx.font = '20px Arial';
      ctx.fillText(`Valid until: ${posterData.validUntil}`, canvas.width / 2, 700);
    }

    if (posterData.contactInfo) {
      ctx.font = '18px Arial';
      ctx.fillText(posterData.contactInfo, canvas.width / 2, 780);
    }
  };

  const downloadPoster = () => {
    generatePosterCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `poster-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const printPoster = () => {
    generatePosterCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head><title>Print Poster</title></head>
        <body style="margin:0;padding:20px;">
          <img src="${canvas.toDataURL()}" style="max-width:100%;height:auto;" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Marketing Poster Maker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Template Selection */}
            <div className="space-y-4">
              <Label>Choose Template</Label>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant={activeTemplate?.id === template.id ? "default" : "outline"}
                    className={`h-20 ${template.bgColor} ${template.textColor} hover:opacity-80`}
                    onClick={() => setActiveTemplate(template)}
                    data-testid={`template-${template.id}`}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Enter main title"
                  value={posterData.title}
                  onChange={(e) => setPosterData({ ...posterData, title: e.target.value })}
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  placeholder="Enter subtitle"
                  value={posterData.subtitle}
                  onChange={(e) => setPosterData({ ...posterData, subtitle: e.target.value })}
                  data-testid="input-subtitle"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter description"
                  value={posterData.description}
                  onChange={(e) => setPosterData({ ...posterData, description: e.target.value })}
                  data-testid="textarea-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Price (€)</Label>
                  <Input
                    placeholder="0.00"
                    value={posterData.price}
                    onChange={(e) => setPosterData({ ...posterData, price: e.target.value })}
                    data-testid="input-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={posterData.validUntil}
                    onChange={(e) => setPosterData({ ...posterData, validUntil: e.target.value })}
                    data-testid="input-valid-until"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contact Info</Label>
                <Input
                  placeholder="Phone, address, website"
                  value={posterData.contactInfo}
                  onChange={(e) => setPosterData({ ...posterData, contactInfo: e.target.value })}
                  data-testid="input-contact"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo Upload</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  data-testid="input-logo"
                />
              </div>
            </div>

            {/* Preview & Actions */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-64 flex items-center justify-center">
                {activeTemplate ? (
                  <div className={`w-full h-full ${activeTemplate.bgColor} ${activeTemplate.textColor} rounded p-4 flex flex-col justify-center items-center text-center`}>
                    <h2 className="font-bold text-lg mb-2">{posterData.title || 'Your Title'}</h2>
                    <p className="text-sm mb-2">{posterData.subtitle || 'Subtitle'}</p>
                    <p className="text-xs mb-2">{posterData.description || 'Description'}</p>
                    {posterData.price && <div className="text-xl font-bold">€{posterData.price}</div>}
                  </div>
                ) : (
                  <p className="text-gray-500">Select a template to preview</p>
                )}
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => setPreviewMode(true)}
                  className="w-full"
                  disabled={!activeTemplate}
                  data-testid="button-preview"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Full Preview
                </Button>
                
                <Button 
                  onClick={downloadPoster}
                  className="w-full"
                  disabled={!activeTemplate}
                  data-testid="button-download"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                
                <Button 
                  onClick={printPoster}
                  variant="outline"
                  className="w-full"
                  disabled={!activeTemplate}
                  data-testid="button-print"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Poster
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  disabled={!activeTemplate}
                  data-testid="button-share"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share / Export
                </Button>
              </div>
            </div>
          </div>

          {/* Hidden Canvas for Generation */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>

      {/* Business-Specific Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Marketing Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setActiveTemplate(templates[0]);
                setPosterData({
                  ...posterData,
                  title: 'SPECIAL OFFER',
                  subtitle: '50% OFF',
                  description: 'Limited time only!',
                  price: '9.99'
                });
              }}
              data-testid="quick-special-offer"
            >
              Special Offer
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setActiveTemplate(templates[4]);
                setPosterData({
                  ...posterData,
                  title: 'HAPPY HOUR',
                  subtitle: '4PM - 7PM',
                  description: 'All drinks half price',
                  price: ''
                });
              }}
              data-testid="quick-happy-hour"
            >
              Happy Hour
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setActiveTemplate(templates[5]);
                setPosterData({
                  ...posterData,
                  title: 'FRESH DAILY',
                  subtitle: 'Baked this morning',
                  description: 'Artisan breads & pastries',
                  price: ''
                });
              }}
              data-testid="quick-fresh-daily"
            >
              Fresh Daily
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setActiveTemplate(templates[1]);
                setPosterData({
                  ...posterData,
                  title: 'NEW ARRIVAL',
                  subtitle: 'Just in stock',
                  description: 'Check out our latest products',
                  price: ''
                });
              }}
              data-testid="quick-new-arrival"
            >
              New Arrival
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}