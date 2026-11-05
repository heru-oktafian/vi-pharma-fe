import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Pill, Stethoscope, User, Calendar, CheckSquare,
  Square, AlertTriangle, Calculator, Sparkles, Scale, Info
} from 'lucide-react';
import { getDoctors, getMedicines } from '../../services/masterDataApi';
import { getStockSummaries } from '../../services/inventoryApi';
import { createPrescription } from '../../services/prescriptionApi';

export default function PrescriptionFormModal({ token, branch, theme, onClose, onSuccess }) {
  const isLight = theme === 'light';
  const branchId = branch?.id || 'CBG000000000001';

  // Master options
  const [doctorsList, setDoctorsList] = useState([]);
  const [stockMedicines, setStockMedicines] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Doctor state
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorSIP, setDoctorSIP] = useState('');
  const [isManualDoctor, setIsManualDoctor] = useState(false);

  // Patient state
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientWeight, setPatientWeight] = useState('');
  const [patientGender, setPatientGender] = useState('L');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Clinical screening checklist
  const [screeningAdmin, setScreeningAdmin] = useState(true);
  const [screeningPharma, setScreeningPharma] = useState(true);
  const [screeningClinical, setScreeningClinical] = useState(true);
  const [screeningNotes, setScreeningNotes] = useState('');
  const [rxNotes, setRxNotes] = useState('');

  // Prescription items (Non-racik & Racikan)
  const [items, setItems] = useState([
    {
      id: 'init-1',
      item_type: 'NON_RACIK',
      medicine_id: '',
      batch_id: '',
      unit_id: '',
      unit_name: 'Tab',
      qty: 10,
      unit_price: 0,
      label_type: 'dalam',
      signa: '3 x Sehari 1 Tablet',
      usage_time: 'Sesudah Makan',
      bud_days: 0,
      detur_status: 'det'
    }
  ]);

  // Load master doctors & stock medicines
  useEffect(() => {
    let mounted = true;
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [docsRes, stocksRes] = await Promise.allSettled([
          getDoctors(token),
          getStockSummaries(token, '', branchId)
        ]);

        if (mounted) {
          if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value)) {
            setDoctorsList(docsRes.value);
            if (docsRes.value.length > 0) {
              const firstDoc = docsRes.value[0];
              setSelectedDoctorId(firstDoc.id);
              setDoctorName(firstDoc.name);
              setDoctorSIP(firstDoc.sip || '');
            }
          }
          if (stocksRes.status === 'fulfilled' && Array.isArray(stocksRes.value)) {
            setStockMedicines(stocksRes.value);
          }
        }
      } catch (err) {
        console.error('Failed to load prescription form master data:', err);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };

    fetchOptions();
    return () => { mounted = false; };
  }, [token, branchId]);

  // Handle doctor selection change
  const handleDoctorChange = (docId) => {
    setSelectedDoctorId(docId);
    if (docId === 'MANUAL') {
      setIsManualDoctor(true);
      setDoctorName('');
      setDoctorSIP('');
    } else {
      setIsManualDoctor(false);
      const found = doctorsList.find((d) => d.id === docId);
      if (found) {
        setDoctorName(found.name);
        setDoctorSIP(found.sip || '');
      }
    }
  };

  // Add Non-Racik Item
  const handleAddNonRacik = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        item_type: 'NON_RACIK',
        medicine_id: '',
        batch_id: '',
        unit_id: '',
        unit_name: 'Tab',
        qty: 10,
        unit_price: 0,
        label_type: 'dalam',
        signa: '3 x Sehari 1 Tablet',
        usage_time: 'Sesudah Makan',
        bud_days: 0,
        detur_status: 'det'
      }
    ]);
  };

  // Add Racikan Item
  const handleAddRacikan = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        item_type: 'RACIKAN',
        racikan_name: `Puyer Racikan #${prev.filter((i) => i.item_type === 'RACIKAN').length + 1}`,
        racikan_dose_form: 'Puyer / Pulveres',
        racikan_qty: 10,
        racikan_unit: 'Bungkus',
        racikan_method: 'DTD',
        embalase_price: 1500,
        tuslah_price: 3000,
        label_type: 'dalam',
        signa: '3 x Sehari 1 Bungkus',
        usage_time: 'Sesudah Makan',
        bud_days: 14,
        detur_status: 'det',
        compound_items: []
      }
    ]);
  };

  const handleRemoveItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update Non-Racik Medicine selection
  const handleSelectMedicineNonRacik = (itemIndex, medId) => {
    const med = stockMedicines.find((m) => m.medicine_id === medId);
    if (!med) return;

    let price = med.sell_price || 0;
    const resepPrice = (med.prices || []).find((p) => p.price_type === 'resep');
    if (resepPrice && resepPrice.price > 0) {
      price = resepPrice.price;
    }

    const firstBatch = (med.batches || [])[0];

    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== itemIndex) return it;
        return {
          ...it,
          medicine_id: med.medicine_id,
          medicine_name: med.name,
          unit_id: med.base_unit_id,
          unit_name: med.base_unit_name || 'Tab',
          batch_id: firstBatch?.id || '',
          unit_price: price,
          signa: it.signa || '3 x Sehari 1 Tablet'
        };
      })
    );
  };

  // Add compound ingredient to racikan
  const handleAddCompoundIngredient = (itemIndex) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== itemIndex) return it;
        const newCompounds = [
          ...(it.compound_items || []),
          {
            id: `comp-${Date.now()}-${Math.random()}`,
            medicine_id: '',
            medicine_name: '',
            batch_id: '',
            unit_id: '',
            unit_name: 'Tab',
            dose_per_pack: 0.5,
            total_qty: (it.racikan_qty || 10) * 0.5,
            unit_price: 0
          }
        ];
        return { ...it, compound_items: newCompounds };
      })
    );
  };

  const handleSelectCompoundMedicine = (itemIndex, compIndex, medId) => {
    const med = stockMedicines.find((m) => m.medicine_id === medId);
    if (!med) return;

    let price = med.sell_price || 0;
    const resepPrice = (med.prices || []).find((p) => p.price_type === 'resep');
    if (resepPrice && resepPrice.price > 0) {
      price = resepPrice.price;
    }
    const firstBatch = (med.batches || [])[0];

    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== itemIndex) return it;
        const updatedCompounds = (it.compound_items || []).map((c, cIdx) => {
          if (cIdx !== compIndex) return c;
          const totalQ = it.racikan_method === 'DTD'
            ? (it.racikan_qty || 1) * (c.dose_per_pack || 1)
            : (c.total_qty || 1);
          return {
            ...c,
            medicine_id: med.medicine_id,
            medicine_name: med.name,
            unit_id: med.base_unit_id,
            unit_name: med.base_unit_name || 'Tab',
            batch_id: firstBatch?.id || '',
            unit_price: price,
            total_qty: totalQ
          };
        });
        return { ...it, compound_items: updatedCompounds };
      })
    );
  };

  const handleUpdateCompoundDose = (itemIndex, compIndex, dose) => {
    const numDose = parseFloat(dose) || 0;
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== itemIndex) return it;
        const updatedCompounds = (it.compound_items || []).map((c, cIdx) => {
          if (cIdx !== compIndex) return c;
          const totalQ = it.racikan_method === 'DTD'
            ? (it.racikan_qty || 1) * numDose
            : numDose;
          return {
            ...c,
            dose_per_pack: numDose,
            total_qty: Math.ceil(totalQ * 100) / 100
          };
        });
        return { ...it, compound_items: updatedCompounds };
      })
    );
  };

  const handleRemoveCompound = (itemIndex, compIndex) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== itemIndex) return it;
        return {
          ...it,
          compound_items: (it.compound_items || []).filter((_, cIdx) => cIdx !== compIndex)
        };
      })
    );
  };

  // Calculate Totals
  let totalMedPrice = 0;
  let totalEmbalase = 0;
  let totalTuslah = 0;

  items.forEach((it) => {
    if (it.item_type === 'NON_RACIK') {
      totalMedPrice += (parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0);
    } else {
      totalEmbalase += parseFloat(it.embalase_price) || 0;
      totalTuslah += parseFloat(it.tuslah_price) || 0;
      (it.compound_items || []).forEach((c) => {
        totalMedPrice += (parseFloat(c.total_qty) || 0) * (parseFloat(c.unit_price) || 0);
      });
    }
  });

  const grandTotal = totalMedPrice + totalEmbalase + totalTuslah;

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!patientName.trim()) {
      setErrorMsg('Nama pasien wajib diisi');
      return;
    }
    if (!doctorName.trim()) {
      setErrorMsg('Nama dokter preskriptor wajib ditentukan');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Minimal masukkan satu item obat atau formula racikan');
      return;
    }

    // Format payload
    const payloadItems = items.map((it) => {
      if (it.item_type === 'NON_RACIK') {
        return {
          item_type: 'NON_RACIK',
          medicine_id: it.medicine_id || null,
          batch_id: it.batch_id || null,
          unit_id: it.unit_id || null,
          qty: parseFloat(it.qty) || 1,
          unit_price: parseFloat(it.unit_price) || 0,
          label_type: it.label_type || 'dalam',
          signa: it.signa || '3 x Sehari 1 Tablet',
          usage_time: it.usage_time || 'Sesudah Makan',
          bud_days: parseInt(it.bud_days, 10) || 0,
          detur_status: it.detur_status || 'det'
        };
      } else {
        const compoundItems = (it.compound_items || []).map((c) => ({
          medicine_id: c.medicine_id,
          batch_id: c.batch_id || null,
          unit_id: c.unit_id,
          dose_per_pack: parseFloat(c.dose_per_pack) || 1,
          total_qty: parseFloat(c.total_qty) || 1,
          unit_price: parseFloat(c.unit_price) || 0
        }));

        return {
          item_type: 'RACIKAN',
          racikan_name: it.racikan_name,
          racikan_dose_form: it.racikan_dose_form,
          racikan_qty: parseInt(it.racikan_qty, 10) || 1,
          racikan_unit: it.racikan_unit,
          racikan_method: it.racikan_method,
          embalase_price: parseFloat(it.embalase_price) || 0,
          tuslah_price: parseFloat(it.tuslah_price) || 0,
          compound_items: compoundItems,
          label_type: it.label_type || 'dalam',
          signa: it.signa || '3 x Sehari 1 Bungkus',
          usage_time: it.usage_time || 'Sesudah Makan',
          bud_days: parseInt(it.bud_days, 10) || 14,
          detur_status: it.detur_status || 'det'
        };
      }
    });

    const payload = {
      doctor_id: isManualDoctor ? null : selectedDoctorId || null,
      doctor_name: doctorName.trim(),
      doctor_sip: doctorSIP.trim(),
      patient_name: patientName.trim(),
      patient_age: parseInt(patientAge, 10) || 0,
      patient_weight: parseFloat(patientWeight) || 0,
      patient_gender: patientGender,
      patient_phone: patientPhone.trim(),
      patient_address: patientAddress.trim(),
      prescription_date: prescriptionDate,
      screening_admin: screeningAdmin,
      screening_pharma: screeningPharma,
      screening_clinical: screeningClinical,
      screening_notes: screeningNotes.trim(),
      notes: rxNotes.trim(),
      items: payloadItems
    };

    setSubmitting(true);
    try {
      await createPrescription(payload, token, branchId);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan resep dokter');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-xs">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Input Resep Dokter & Formula Racikan Baru</h3>
              <p className="text-xs text-slate-400">
                Pendaftaran resep klinis & kalkulator racikan otomatis Apotek Vi-Pharma
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Data Dokter & Pasien */}
          <div
            className={`p-4 rounded-xl border space-y-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/30 border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Stethoscope className="w-4 h-4 text-emerald-500" />
              <span>1. Identitas Dokter Preskriptor & Pasien</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dokter */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">
                  Dokter Preskriptor <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={isManualDoctor ? 'MANUAL' : selectedDoctorId}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg border transition ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    {doctorsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization || 'Umum'})
                      </option>
                    ))}
                    <option value="MANUAL">+ Input Dokter Lain / Manual</option>
                  </select>
                </div>

                {isManualDoctor && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Nama Dokter..."
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required
                      className={`px-3 py-1.5 text-xs rounded-lg border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="SIP Dokter..."
                      value={doctorSIP}
                      onChange={(e) => setDoctorSIP(e.target.value)}
                      className={`px-3 py-1.5 text-xs rounded-lg border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Tgl Resep */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Tanggal Resep Dokter
                </label>
                <input
                  type="date"
                  value={prescriptionDate}
                  onChange={(e) => setPrescriptionDate(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            {/* Data Pasien */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Nama Pasien <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: An. Kevin Pratama / Ny. Ratna"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Usia Pasien (Tahun)
                </label>
                <input
                  type="number"
                  placeholder="Misal: 7"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Berat Badan (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Misal: 22.5"
                  value={patientWeight}
                  onChange={(e) => setPatientWeight(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="0812..."
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Alamat Pasien
                </label>
                <input
                  type="text"
                  placeholder="Alamat domisili..."
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Skrining Resep 3 Pilar Apoteker */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/30 border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>2. Telaah & Skrining Klinis Resep (Standar Permenkes)</span>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold border border-emerald-500/20">
                Wajib Apoteker
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                onClick={() => setScreeningAdmin(!screeningAdmin)}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none text-xs transition ${
                  screeningAdmin
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium'
                    : 'bg-slate-800/20 border-slate-700 text-slate-400'
                }`}
              >
                <div className="mt-0.5 text-emerald-500">
                  {screeningAdmin ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                </div>
                <div>
                  <div className="font-bold">1. Administratif</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    Nama, SIP dokter, tgl, & data pasien lengkap.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setScreeningPharma(!screeningPharma)}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none text-xs transition ${
                  screeningPharma
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium'
                    : 'bg-slate-800/20 border-slate-700 text-slate-400'
                }`}
              >
                <div className="mt-0.5 text-emerald-500">
                  {screeningPharma ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                </div>
                <div>
                  <div className="font-bold">2. Farmasetis</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    Bentuk sediaan, kekuatan, & kompatibilitas racik.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setScreeningClinical(!screeningClinical)}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none text-xs transition ${
                  screeningClinical
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium'
                    : 'bg-slate-800/20 border-slate-700 text-slate-400'
                }`}
              >
                <div className="mt-0.5 text-emerald-500">
                  {screeningClinical ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                </div>
                <div>
                  <div className="font-bold">3. Klinis / Dosis</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    Tepat dosis/BB anak, tanpa duplikasi / interaksi.
                  </div>
                </div>
              </label>
            </div>

            <div>
              <input
                type="text"
                placeholder="Catatan skrining klinis apoteker (opsional)..."
                value={screeningNotes}
                onChange={(e) => setScreeningNotes(e.target.value)}
                className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Section 3: Daftar Obat & Formula Racikan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Pill className="w-4 h-4 text-emerald-500" />
                <span>3. Formularium Resep ({items.length} Item)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddNonRacik}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Obat Jadi</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddRacikan}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Obat Racikan (Puyer/Kapsul)</span>
                </button>
              </div>
            </div>

            {/* List Items */}
            <div className="space-y-4">
              {items.map((item, itemIdx) => {
                const isRacik = item.item_type === 'RACIKAN';

                if (!isRacik) {
                  // Card Obat Non-Racik
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border space-y-3 ${
                        isLight ? 'bg-blue-50/30 border-blue-200' : 'bg-slate-800/40 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                            Obat Jadi #{itemIdx + 1}
                          </span>
                          <span className="font-semibold text-xs">
                            {item.medicine_name || 'Pilih Obat...'}
                          </span>
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(itemIdx)}
                            className="p-1 rounded text-red-400 hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Pilih Obat dari Inventori Apotek
                          </label>
                          <select
                            value={item.medicine_id}
                            onChange={(e) => handleSelectMedicineNonRacik(itemIdx, e.target.value)}
                            required
                            className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          >
                            <option value="">-- Pilih Obat --</option>
                            {stockMedicines.map((m) => (
                              <option key={m.medicine_id} value={m.medicine_id}>
                                {m.name} (Stok Rak: {m.total_shelf} {m.base_unit_name})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Jumlah (Qty)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setItems((prev) =>
                                prev.map((x, i) => (i === itemIdx ? { ...x, qty: v } : x))
                              );
                            }}
                            className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Harga Satuan (Resep)
                          </label>
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setItems((prev) =>
                                prev.map((x, i) => (i === itemIdx ? { ...x, unit_price: v } : x))
                              );
                            }}
                            className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Signa & Etiket Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">
                            Aturan Pakai / Signa <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="3 x Sehari 1 Tablet"
                            value={item.signa}
                            onChange={(e) => {
                              const v = e.target.value;
                              setItems((prev) =>
                                prev.map((x, i) => (i === itemIdx ? { ...x, signa: v } : x))
                              );
                            }}
                            required
                            className={`w-full px-2.5 py-1 text-xs rounded-md border ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Waktu Minum</label>
                          <input
                            type="text"
                            placeholder="Sesudah Makan / Sebelum Makan"
                            value={item.usage_time}
                            onChange={(e) => {
                              const v = e.target.value;
                              setItems((prev) =>
                                prev.map((x, i) => (i === itemIdx ? { ...x, usage_time: v } : x))
                              );
                            }}
                            className={`w-full px-2.5 py-1 text-xs rounded-md border ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] text-slate-400 mb-1">Jenis Etiket</label>
                            <select
                              value={item.label_type}
                              onChange={(e) => {
                                const v = e.target.value;
                                setItems((prev) =>
                                  prev.map((x, i) => (i === itemIdx ? { ...x, label_type: v } : x))
                                );
                              }}
                              className={`w-full px-2 py-1 text-xs rounded-md border ${
                                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                              }`}
                            >
                              <option value="dalam">Putih (Obat Dalam)</option>
                              <option value="luar">Biru (Obat Luar)</option>
                            </select>
                          </div>
                          <div className="w-20">
                            <label className="block text-[10px] text-slate-400 mb-1">Status</label>
                            <select
                              value={item.detur_status}
                              onChange={(e) => {
                                const v = e.target.value;
                                setItems((prev) =>
                                  prev.map((x, i) => (i === itemIdx ? { ...x, detur_status: v } : x))
                                );
                              }}
                              className={`w-full px-2 py-1 text-xs rounded-md border ${
                                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                              }`}
                            >
                              <option value="det">det</option>
                              <option value="ne_det">ne det</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Card Formula Racikan (Compounding)
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border-2 space-y-3 ${
                      isLight
                        ? 'bg-emerald-50/30 border-emerald-300'
                        : 'bg-emerald-950/15 border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Racikan #{itemIdx + 1}</span>
                        </span>
                        <input
                          type="text"
                          value={item.racikan_name}
                          onChange={(e) => {
                            const v = e.target.value;
                            setItems((prev) =>
                              prev.map((x, i) => (i === itemIdx ? { ...x, racikan_name: v } : x))
                            );
                          }}
                          className={`px-2 py-0.5 text-xs font-bold rounded border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(itemIdx)}
                          className="p-1 rounded text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Racikan Parameters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Bentuk Sediaan</label>
                        <select
                          value={item.racikan_dose_form}
                          onChange={(e) => {
                            const v = e.target.value;
                            setItems((prev) =>
                              prev.map((x, i) => (i === itemIdx ? { ...x, racikan_dose_form: v } : x))
                            );
                          }}
                          className={`w-full px-2.5 py-1 text-xs rounded-md border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        >
                          <option value="Puyer / Pulveres">Puyer / Pulveres</option>
                          <option value="Kapsul">Kapsul</option>
                          <option value="Salep Campuran">Salep Campuran</option>
                          <option value="Sirup Racikan">Sirup Racikan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Jumlah Bungkus / Kemasan</label>
                        <input
                          type="number"
                          min="1"
                          value={item.racikan_qty}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10) || 1;
                            setItems((prev) =>
                              prev.map((x, i) => {
                                if (i !== itemIdx) return x;
                                // Recalculate compound total qty if DTD
                                const updatedCompounds = (x.compound_items || []).map((c) => ({
                                  ...c,
                                  total_qty: x.racikan_method === 'DTD'
                                    ? Math.ceil(v * (c.dose_per_pack || 1) * 100) / 100
                                    : c.total_qty
                                }));
                                return { ...x, racikan_qty: v, compound_items: updatedCompounds };
                              })
                            );
                          }}
                          className={`w-full px-2.5 py-1 text-xs rounded-md border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Metode Racik</label>
                        <select
                          value={item.racikan_method}
                          onChange={(e) => {
                            const v = e.target.value;
                            setItems((prev) =>
                              prev.map((x, i) => (i === itemIdx ? { ...x, racikan_method: v } : x))
                            );
                          }}
                          className={`w-full px-2.5 py-1 text-xs rounded-md border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        >
                          <option value="DTD">DTD (Dosis per bungkus x Qty)</option>
                          <option value="NON_DTD">Non-DTD (Total dibagi Qty)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Tuslah & Embalase (Rp)</label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            placeholder="Embalase"
                            value={item.embalase_price}
                            title="Biaya Embalase (kertas/kapsul)"
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setItems((prev) =>
                                prev.map((x, i) => (i === itemIdx ? { ...x, embalase_price: v } : x))
                              );
                            }}
                            className={`w-1/2 px-2 py-1 text-xs rounded-md border ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                          <input
                            type="number"
                            placeholder="Tuslah"
                            value={item.tuslah_price}
                            title="Tuslah Jasa Racik Apotek"
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setItems((prev) =>
                                prev.map((x, i) => (i === itemIdx ? { ...x, tuslah_price: v } : x))
                              );
                            }}
                            className={`w-1/2 px-2 py-1 text-xs rounded-md border ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-table: Bahan Aktif Racikan */}
                    <div className="p-3 rounded-lg bg-black/10 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                        <span>Bahan Baku Racikan ({item.compound_items?.length || 0} bahan)</span>
                        <button
                          type="button"
                          onClick={() => handleAddCompoundIngredient(itemIdx)}
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah Bahan Obat</span>
                        </button>
                      </div>

                      {item.compound_items?.length === 0 ? (
                        <div className="p-3 text-center text-[11px] text-slate-400 italic">
                          Belum ada bahan aktif ditambahkan. Klik "Tambah Bahan Obat" di atas.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {item.compound_items.map((comp, compIdx) => (
                            <div
                              key={comp.id || compIdx}
                              className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded bg-black/20 text-xs"
                            >
                              <div className="flex-1 min-w-[200px]">
                                <select
                                  value={comp.medicine_id}
                                  onChange={(e) =>
                                    handleSelectCompoundMedicine(itemIdx, compIdx, e.target.value)
                                  }
                                  required
                                  className={`w-full px-2 py-1 text-xs rounded border ${
                                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                                  }`}
                                >
                                  <option value="">-- Pilih Obat Bahan Racikan --</option>
                                  {stockMedicines.map((m) => (
                                    <option key={m.medicine_id} value={m.medicine_id}>
                                      {m.name} (Stok: {m.total_shelf} {m.base_unit_name})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="w-24">
                                <label className="block text-[9px] text-slate-400">Dosis / Bgks</label>
                                <input
                                  type="number"
                                  step="0.05"
                                  min="0.01"
                                  value={comp.dose_per_pack}
                                  onChange={(e) =>
                                    handleUpdateCompoundDose(itemIdx, compIdx, e.target.value)
                                  }
                                  className={`w-full px-2 py-0.5 text-xs rounded border ${
                                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                                  }`}
                                />
                              </div>

                              <div className="w-24 text-right">
                                <div className="text-[9px] text-slate-400">Kebutuhan Total</div>
                                <div className="font-bold text-emerald-400">
                                  {comp.total_qty} {comp.unit_name}
                                </div>
                              </div>

                              <div className="w-28 text-right">
                                <div className="text-[9px] text-slate-400">Subtotal</div>
                                <div className="font-semibold text-slate-200">
                                  Rp {((comp.total_qty || 0) * (comp.unit_price || 0)).toLocaleString('id-ID')}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveCompound(itemIdx, compIdx)}
                                className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Signa Racikan */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-emerald-500/20">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">
                          Signa / Aturan Pakai <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.signa}
                          placeholder="3 x Sehari 1 Bungkus"
                          onChange={(e) => {
                            const v = e.target.value;
                            setItems((prev) =>
                              prev.map((x, i) => (i === itemIdx ? { ...x, signa: v } : x))
                            );
                          }}
                          required
                          className={`w-full px-2.5 py-1 text-xs rounded-md border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Waktu Minum</label>
                        <input
                          type="text"
                          value={item.usage_time}
                          placeholder="Sesudah Makan"
                          onChange={(e) => {
                            const v = e.target.value;
                            setItems((prev) =>
                              prev.map((x, i) => (i === itemIdx ? { ...x, usage_time: v } : x))
                            );
                          }}
                          className={`w-full px-2.5 py-1 text-xs rounded-md border ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-400 mb-1">BUD (Hari)</label>
                          <input
                            type="number"
                            value={item.bud_days}
                            placeholder="14"
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10) || 0;
                              setItems((prev) =>
                                prev.map((x, i) => (i === itemIdx ? { ...x, bud_days: v } : x))
                              );
                            }}
                            className={`w-full px-2 py-1 text-xs rounded-md border ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-[10px] text-slate-400 mb-1">Status</label>
                          <select
                            value={item.detur_status}
                            onChange={(e) => {
                              const v = e.target.value;
                              setItems((prev) =>
                                prev.map((x, i) => (i === itemIdx ? { ...x, detur_status: v } : x))
                              );
                            }}
                            className={`w-full px-2 py-1 text-xs rounded-md border ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          >
                            <option value="det">det</option>
                            <option value="ne_det">ne det</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Ringkasan Total Biaya */}
          <div
            className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div className="flex flex-wrap gap-4 text-xs">
              <div>
                <span className="text-slate-400">Total Bahan Obat:</span>{' '}
                <strong className="text-slate-900 dark:text-white">Rp {totalMedPrice.toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span className="text-slate-400">Total Embalase:</span>{' '}
                <strong className="text-slate-900 dark:text-white">Rp {totalEmbalase.toLocaleString('id-ID')}</strong>
              </div>
              <div>
                <span className="text-slate-400">Total Tuslah Jasa:</span>{' '}
                <strong className="text-slate-900 dark:text-white">Rp {totalTuslah.toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Biaya Resep</span>
              <span className="text-xl font-extrabold text-emerald-500">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {submitting ? 'Menyimpan Resep...' : 'Simpan Resep & Masukkan ke Antrean'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
