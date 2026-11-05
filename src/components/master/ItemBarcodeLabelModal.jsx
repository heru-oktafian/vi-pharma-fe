import React, { useState, useEffect, useRef } from 'react';
import {
  X, Printer, QrCode, Tag, Sliders, Layers, Eye, Check,
  Sparkles, Store, MapPin, Hash, Plus, Minus, Copy, AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';

// Barcode 1D SVG subcomponent
function Barcode1DItem({ value, height = 30, width = 1.3, displayValue = false, fontSize = 9 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, String(value), {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          margin: 0,
          background: 'transparent',
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('JsBarcode render error for:', value, err);
      }
    }
  }, [value, height, width, displayValue, fontSize]);

  if (!value) return null;

  return (
    <svg
      ref={svgRef}
      className="max-w-full block mx-auto"
      style={{ overflow: 'visible' }}
    />
  );
}

export default function ItemBarcodeLabelModal({
  isOpen,
  onClose,
  medicine,
  branch,
  theme = 'dark',
}) {
  if (!isOpen || !medicine) return null;

  const isLight = theme === 'light';

  // Config State
  const [codeType, setCodeType] = useState('barcode'); // 'barcode', 'qrcode', 'both'
  const [labelSize, setLabelSize] = useState('40x30'); // '40x30', '33x15', '50x30', '60x40'
  const [copies, setCopies] = useState(1);
  const [priceType, setPriceType] = useState('umum'); // 'umum', 'resep', 'member'
  const [showPharmacyName, setShowPharmacyName] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showItemCode, setShowItemCode] = useState(true);
  const [showPrintDate, setShowPrintDate] = useState(false);
  const [previewScale, setPreviewScale] = useState(1.5); // 1.0, 1.5, 2.0 for screen viewing comfort

  // Target values
  const pharmacyName = branch?.branch_name || 'VI-PHARMA APOTEK';
  const medicineName = medicine.name || 'Nama Obat';
  const itemCode = medicine.item_code || medicine.id || 'ITEM-001';
  const rawBarcode = medicine.barcode || itemCode;
  const storageLocation = medicine.storage_location || 'Rak A';
  const baseUnitName = medicine.base_unit_name || medicine.base_unit?.name || medicine.units?.[0]?.unit?.name || 'Pcs';

  // Determine selling price
  const pricesList = medicine.prices || [];
  const foundPrice = pricesList.find(p => p.price_type === priceType) ||
    pricesList.find(p => p.price_type === 'umum') ||
    pricesList[0];
  const activePriceNumber = foundPrice ? Number(foundPrice.price) : 0;
  const [customPrice, setCustomPrice] = useState(activePriceNumber);

  useEffect(() => {
    setCustomPrice(activePriceNumber);
  }, [activePriceNumber]);

  // Scannable value: barcode preferred, item_code as fallback
  const scannableCode = rawBarcode || itemCode;

  // Formatter
  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  // Dimensions configuration for screen & thermal printer
  const sizeMap = {
    '33x15': {
      widthMm: 33,
      heightMm: 15,
      widthPx: 125,
      heightPx: 57,
      name: '33 x 15 mm (Mini Strip / Botol)',
      barcodeH: 18,
      barcodeW: 1.0,
      qrSize: 32,
    },
    '40x30': {
      widthMm: 40,
      heightMm: 30,
      widthPx: 151,
      heightPx: 113,
      name: '40 x 30 mm (Standar Rak / Box)',
      barcodeH: 26,
      barcodeW: 1.2,
      qrSize: 44,
    },
    '50x30': {
      widthMm: 50,
      heightMm: 30,
      widthPx: 189,
      heightPx: 113,
      name: '50 x 30 mm (Label Rak Sedang)',
      barcodeH: 28,
      barcodeW: 1.3,
      qrSize: 48,
    },
    '60x40': {
      widthMm: 60,
      heightMm: 40,
      widthPx: 227,
      heightPx: 151,
      name: '60 x 40 mm (Label Box Besar / Gudang)',
      barcodeH: 34,
      barcodeW: 1.5,
      qrSize: 56,
    },
  };

  const currentSizeConfig = sizeMap[labelSize] || sizeMap['40x30'];

  // Single sticker content renderer
  const renderStickerContent = (isScreenPreview = false) => {
    const isMini = labelSize === '33x15';

    if (isMini) {
      // 33 x 15 mm layout (compact)
      return (
        <div className="w-full h-full flex flex-col justify-between p-1 text-black font-sans box-border overflow-hidden leading-none select-none bg-white">
          <div className="flex items-center justify-between text-[8px] font-bold border-b border-black/30 pb-0.5">
            <span className="truncate max-w-[65%] font-extrabold">{medicineName}</span>
            <span className="font-mono text-[7.5px]">{formatIDR(customPrice)}</span>
          </div>

          <div className="my-auto flex items-center justify-center py-0.5">
            {codeType === 'qrcode' ? (
              <QRCodeSVG
                value={scannableCode}
                size={currentSizeConfig.qrSize}
                level="M"
                includeMargin={false}
              />
            ) : (
              <Barcode1DItem
                value={scannableCode}
                height={currentSizeConfig.barcodeH}
                width={currentSizeConfig.barcodeW}
                displayValue={false}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[7px] font-mono text-black font-semibold pt-0.5">
            <span className="truncate">{itemCode}</span>
            <span>/{baseUnitName}</span>
          </div>
        </div>
      );
    }

    // 40x30 mm, 50x30 mm, 60x40 mm layouts
    return (
      <div className="w-full h-full flex flex-col justify-between p-1.5 sm:p-2 text-black font-sans box-border overflow-hidden select-none bg-white border border-transparent">
        {/* Top Header: Apotek & Lokasi */}
        <div className="flex items-center justify-between border-b border-black/40 pb-1 leading-tight">
          {showPharmacyName && (
            <span className="text-[8.5px] font-black tracking-tight uppercase truncate max-w-[70%]">
              {pharmacyName}
            </span>
          )}
          {showLocation && storageLocation && (
            <span className="text-[7.5px] font-bold px-1 bg-black text-white rounded-xs">
              {storageLocation}
            </span>
          )}
        </div>

        {/* Medicine Name */}
        <div className="my-0.5 leading-tight">
          <div className="text-[10px] font-black tracking-tight line-clamp-2 uppercase">
            {medicineName}
          </div>
        </div>

        {/* Barcode & QR Code Center Section */}
        <div className="my-auto flex items-center justify-center gap-1.5 py-0.5 overflow-hidden">
          {codeType === 'barcode' && (
            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
              <Barcode1DItem
                value={scannableCode}
                height={currentSizeConfig.barcodeH}
                width={currentSizeConfig.barcodeW}
                displayValue={false}
              />
              {showItemCode && (
                <span className="font-mono text-[8px] font-bold tracking-wider mt-0.5 text-black">
                  {scannableCode}
                </span>
              )}
            </div>
          )}

          {codeType === 'qrcode' && (
            <div className="flex flex-col items-center justify-center">
              <QRCodeSVG
                value={scannableCode}
                size={currentSizeConfig.qrSize}
                level="M"
                includeMargin={false}
              />
              {showItemCode && (
                <span className="font-mono text-[7.5px] font-bold tracking-tight mt-0.5">
                  {scannableCode}
                </span>
              )}
            </div>
          )}

          {codeType === 'both' && (
            <div className="flex items-center justify-between w-full gap-1">
              <div className="flex-1 flex flex-col items-center overflow-hidden">
                <Barcode1DItem
                  value={scannableCode}
                  height={currentSizeConfig.barcodeH - 4}
                  width={currentSizeConfig.barcodeW * 0.9}
                  displayValue={false}
                />
                <span className="font-mono text-[7px] font-bold truncate">
                  {scannableCode}
                </span>
              </div>
              <div className="shrink-0 flex items-center justify-center">
                <QRCodeSVG
                  value={scannableCode}
                  size={currentSizeConfig.qrSize - 6}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Price & Unit Bar */}
        <div className="border-t border-black/40 pt-1 flex items-baseline justify-between leading-none mt-auto">
          <div className="flex flex-col">
            <span className="text-[6.5px] uppercase font-bold text-gray-700">
              Harga ({priceType}):
            </span>
            <span className="font-black font-mono text-[11px] tracking-tight">
              {formatIDR(customPrice)}
            </span>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-[6.5px] uppercase font-bold text-gray-700">Satuan</span>
            <span className="text-[9px] font-bold uppercase">{baseUnitName}</span>
          </div>
        </div>

        {showPrintDate && (
          <div className="text-[6px] text-gray-500 font-mono text-center -mb-0.5 mt-0.5">
            Cetak: {new Date().toLocaleDateString('id-ID')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      {/* Dynamic Print CSS for Thermal Roll / Sticker */}
      <style>{`
        @media print {
          @page {
            size: ${currentSizeConfig.widthMm}mm ${currentSizeConfig.heightMm}mm;
            margin: 0mm;
          }
          html, body {
            margin: 0mm !important;
            padding: 0mm !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-thermal-labels,
          #printable-thermal-labels * {
            visibility: visible !important;
          }
          #printable-thermal-labels {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
          }
          .thermal-single-sticker {
            width: ${currentSizeConfig.widthMm}mm !important;
            height: ${currentSizeConfig.heightMm}mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Dialog Container */}
      <div className={`w-full max-w-4xl max-h-[95vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-token-card border-token-border text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-vip-navy-light border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
              isLight ? 'bg-white text-vip-navy border-vip-navy-border' : 'bg-token-card text-token-emerald border-token-border'
            }`}>
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-bold ${isLight ? 'text-vip-navy' : 'text-white'}`}>
                  Cetak Label Barcode / QR-Code Thermal
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-token-emerald/15 text-token-emerald border border-token-emerald/30">
                  Hardware Gun Ready
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Label sticker rak & produk farmasi yang kompatibel dengan laser gun / 2D image scanner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid: Controls (Left) & Preview (Right) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Controls Column (Left, col-span-7) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Medicine Brief Header */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
            }`}>
              <div className="flex-1 min-w-0 pr-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Target Item Obat</span>
                <div className="text-sm font-bold truncate text-slate-900 dark:text-white">
                  {medicineName}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                  <span>Kode: {itemCode}</span>
                  {rawBarcode && rawBarcode !== itemCode && (
                    <span className="text-token-emerald">Barcode: {rawBarcode}</span>
                  )}
                  <span>({baseUnitName})</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Harga Aktif</span>
                <span className="text-sm font-bold font-mono text-token-emerald">
                  {formatIDR(customPrice)}
                </span>
              </div>
            </div>

            {/* 1. Format Kode Barcode / QR */}
            <div>
              <label className="text-xs font-bold block mb-1.5 text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-token-emerald" />
                <span>1. Tipe Kode Scanner</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCodeType('barcode')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                    codeType === 'barcode'
                      ? 'bg-token-emerald text-white border-token-emerald shadow-xs'
                      : (isLight ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300' : 'bg-token-card text-slate-300 border-token-border hover:bg-slate-800')
                  }`}
                >
                  <Tag className="w-4 h-4 mx-auto mb-1" />
                  <span>Barcode 1D (Code128)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCodeType('qrcode')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                    codeType === 'qrcode'
                      ? 'bg-token-emerald text-white border-token-emerald shadow-xs'
                      : (isLight ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300' : 'bg-token-card text-slate-300 border-token-border hover:bg-slate-800')
                  }`}
                >
                  <QrCode className="w-4 h-4 mx-auto mb-1" />
                  <span>QR-Code (2D)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCodeType('both')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                    codeType === 'both'
                      ? 'bg-token-emerald text-white border-token-emerald shadow-xs'
                      : (isLight ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300' : 'bg-token-card text-slate-300 border-token-border hover:bg-slate-800')
                  }`}
                >
                  <Layers className="w-4 h-4 mx-auto mb-1" />
                  <span>Dual (Barcode + QR)</span>
                </button>
              </div>
            </div>

            {/* 2. Ukuran Label Stiker Thermal */}
            <div>
              <label className="text-xs font-bold block mb-1.5 text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>2. Ukuran Label Stiker Thermal Printer</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(sizeMap).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLabelSize(key)}
                    className={`py-2 px-3 rounded-xl text-left border transition ${
                      labelSize === key
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : (isLight ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300' : 'bg-token-card text-slate-300 border-token-border hover:bg-slate-800')
                    }`}
                  >
                    <div className="text-xs font-bold">{key} mm</div>
                    <div className="text-[10px] opacity-80 truncate">{cfg.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Pilihan Harga & Satuan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Tier Harga Pada Label
                </label>
                <div className="flex gap-1.5">
                  {['umum', 'resep', 'member'].map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setPriceType(tier)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold capitalize border transition ${
                        priceType === tier
                          ? (isLight ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-900 border-white')
                          : (isLight ? 'bg-white text-slate-600 border-slate-200' : 'bg-token-card text-slate-400 border-token-border')
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1 text-slate-400 uppercase tracking-wider">
                  Nominal Harga (Rp)
                </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border ${
                    isLight ? 'bg-white border-slate-300' : 'bg-token-card border-token-border text-white'
                  }`}
                />
              </div>
            </div>

            {/* 4. Opsi Tampilan & Elemen Label */}
            <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner/50 border-token-border'
            }`}>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Elemen Informasi Label
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPharmacyName}
                    onChange={(e) => setShowPharmacyName(e.target.checked)}
                    className="rounded text-token-emerald focus:ring-0"
                  />
                  <span>Nama Apotek</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="rounded text-token-emerald focus:ring-0"
                  />
                  <span>Posisi Rak</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showItemCode}
                    onChange={(e) => setShowItemCode(e.target.checked)}
                    className="rounded text-token-emerald focus:ring-0"
                  />
                  <span>Kode Item</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPrintDate}
                    onChange={(e) => setShowPrintDate(e.target.checked)}
                    className="rounded text-token-emerald focus:ring-0"
                  />
                  <span>Tanggal Cetak</span>
                </label>
              </div>
            </div>

            {/* 5. Jumlah Salinan Cetak (Copies) */}
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              <div>
                <span className="text-xs font-bold text-amber-500 block">Jumlah Cetak Label</span>
                <span className="text-[11px] text-slate-400">Berapa stiker yang ingin Anda print sekaligus?</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-token-card p-1 rounded-lg border border-token-border">
                  <button
                    type="button"
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-7 h-7 rounded flex items-center justify-center bg-slate-700/50 hover:bg-slate-700 text-white transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center text-xs font-bold font-mono bg-transparent border-0 focus:ring-0 p-0 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setCopies(copies + 1)}
                    className="w-7 h-7 rounded flex items-center justify-center bg-slate-700/50 hover:bg-slate-700 text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-1">
                  {[2, 5, 10].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setCopies(cnt)}
                      className="px-2 py-1 rounded text-xs font-bold border bg-token-card hover:bg-slate-700 border-token-border text-slate-300"
                    >
                      +{cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Column (Right, col-span-5) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center gap-3 p-4 rounded-xl border bg-slate-900/40 border-token-border">
            <div className="w-full flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold flex items-center gap-1.5 text-slate-300">
                <Eye className="w-4 h-4 text-token-emerald" />
                <span>Simulasi Tampilan Stiker ({currentSizeConfig.widthMm}x{currentSizeConfig.heightMm} mm)</span>
              </span>

              {/* Preview Zoom Controls */}
              <div className="flex items-center gap-1">
                {[1.0, 1.5, 2.0].map(sc => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setPreviewScale(sc)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition border ${
                      previewScale === sc
                        ? 'bg-token-emerald text-white border-token-emerald'
                        : 'bg-token-card text-slate-400 border-token-border hover:text-white'
                    }`}
                  >
                    {Math.round(sc * 100)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Sticker Preview Box */}
            <div className="w-full flex-1 flex items-center justify-center p-4 min-h-[220px]">
              <div
                style={{
                  width: `${currentSizeConfig.widthPx * previewScale}px`,
                  height: `${currentSizeConfig.heightPx * previewScale}px`,
                  transformOrigin: 'center center',
                }}
                className="rounded-md shadow-2xl border border-slate-300 overflow-hidden bg-white text-black transition-all flex flex-col"
              >
                {renderStickerContent(true)}
              </div>
            </div>

            <div className="w-full p-2.5 rounded-lg bg-token-inner/80 border border-token-border text-[11px] text-slate-400 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-token-emerald shrink-0 mt-0.5" />
              <span>
                Format dioptimalkan untuk roll sticker thermal printer (Panda, Xprinter, Blueprint, Zebra, SATO, Iware). Hasil cetak hitam tajam scannable oleh QR-gun USB/Bluetooth.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-3.5 px-5 border-t flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-token-inner border-token-border'
        }`}>
          <div className="text-xs text-slate-400">
            Total Dicetak: <strong className="text-white font-mono">{copies}</strong> lembar stiker
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-token-card hover:bg-slate-700 text-slate-200 border-token-border'
              }`}
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                isLight
                  ? 'bg-vip-navy hover:bg-vip-navy-dark text-white'
                  : 'bg-token-emerald hover:bg-token-emerald-dark text-slate-950'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {copies} Label Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Thermal Print Container Rendered for window.print() */}
      <div id="printable-thermal-labels" className="hidden">
        {Array.from({ length: copies }).map((_, idx) => (
          <div key={idx} className="thermal-single-sticker">
            {renderStickerContent(false)}
          </div>
        ))}
      </div>
    </div>
  );
}
