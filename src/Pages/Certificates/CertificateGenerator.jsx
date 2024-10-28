import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, AlertCircle, ArrowLeft, CheckCircle2, Mail, Loader2 } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export default function CertificateGenerator() {
  const { eventId } = useParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { events, getNameByEmail } = useEventStore();
  const event = events.find(e => e.id === eventId);

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0A0118] flex items-center justify-center">
        <div className="text-center bg-white/5 backdrop-blur-xl border border-red-500/20 p-8 rounded-2xl">
          <AlertCircle className="mx-auto h-16 w-16 text-red-400" />
          <h2 className="mt-4 text-xl font-semibold text-white">Event not found</h2>
          <a href="/certificate" className="mt-4 inline-flex items-center text-purple-400 hover:text-purple-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </a>
        </div>
      </div>
    );
  }

  const generateCertificate = async () => {
    const name = getNameByEmail(eventId, email);
    
    if (!name) {
      setError('Email not registered for this event');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 600]
      });

      // Load and add template image
      const img = new Image();
      img.src = event.templateImage;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load template image'));
      });

      doc.addImage(img, 'JPEG', 0, 0, 800, 600);

      // Add participant name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(event.namePosition.fontSize);
      doc.setTextColor(event.namePosition.fontColor);
      doc.text(name, event.namePosition.x, event.namePosition.y, { 
        align: 'center',
        baseline: 'middle'
      });

      // Format QR code text
      const qrText = 
        `This certificate is verified by nameSpace with the below details:\n\n` +
        `Email: ${email}\n` +
        `Name: ${name}\n` +
        `Event name: ${event.name}\n` +
        `Date: ${new Date(event.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`;

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(qrText, {
        width: event.qrPosition.size,
        margin: 0,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H' // Highest error correction level for better readability
      });

      // Add QR code to the certificate
      doc.addImage(
        qrCodeDataURL, 
        'PNG', 
        event.qrPosition.x, 
        event.qrPosition.y, 
        event.qrPosition.size, 
        event.qrPosition.size
      );

      doc.save(`${event.name}-${name}-certificate.pdf`);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to generate certificate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0118] bg-gradient-to-b from-purple-900/20 to-blue-900/20 py-36 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-conic from-purple-500/20 via-purple-500/0 to-purple-500/20 animate-spin-slow" 
             style={{ borderRadius: '40%' }} />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-conic from-blue-500/20 via-blue-500/0 to-blue-500/20 animate-spin-slow" 
             style={{ borderRadius: '40%' }} />
      </div>
      
      <div className="absolute inset-0 backdrop-blur-3xl" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-[128px] animate-pulse-slow delay-700" />
    
      <div className="max-w-lg mx-auto relative">
        <a href="/certificate" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </a>

        {/* Form */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              {event.name}
            </h2>
            <p className="mt-2 text-gray-400">Certificate Generator</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            generateCertificate();
          }}>
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  className="pl-10 w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-900/50 border border-red-500/50 p-4 backdrop-blur-xl">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-300">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-900/50 border border-green-500/50 p-4 backdrop-blur-xl">
                <div className="flex">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-300">Certificate generated successfully!</h3>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg font-medium text-white 
                ${isLoading 
                  ? 'bg-purple-500/70 cursor-not-allowed' 
                  : 'bg-purple-500 hover:bg-purple-600 transition-colors'}`
              }
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              {isLoading ? 'Generating...' : 'Generate Certificate'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}