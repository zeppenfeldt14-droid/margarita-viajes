import { useState } from "react";
import { FileText, Send, Eye, X, ArrowLeft } from "lucide-react";

export default function Quotes() {
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [discount, setDiscount] = useState(0);

  // MOCK DATA BASED ON MOCKUPS
  const quotes = [
    { 
      id: "C001005", email: "margaritaviajegerencia@gmail.com", 
      monthQuery: "MARZO", monthTravel: "MARZO", 
      status: "NUEVO", 
      details: { hotel: "Paradise Surf", adults: 2, children: 0, arrival: "2026-03-12", departure: "2026-03-14", basePrice: 140 }
    },
    { 
      id: "C001004", email: "alejandrodaeambrosio@gmail.com", 
      monthQuery: "MARZO", monthTravel: "MARZO", 
      status: "NUEVO",
      details: { hotel: "Palm Beach", adults: 3, children: 1, arrival: "2026-03-20", departure: "2026-03-22", basePrice: 240 }
    },
    { 
      id: "C001003", email: "luis@gmail.com", 
      monthQuery: "MARZO", monthTravel: "MARZO", 
      status: "VENDIDO",
      details: { hotel: "Hesperia", adults: 2, children: 0, arrival: "2026-04-10", departure: "2026-04-15", basePrice: 325 }
    }
  ];

  const handleOpenQuote = (quote: any) => {
    setSelectedQuote(quote);
    setDiscount(0); // reset
  };

  const calculateTotal = (base: number, disc: number) => {
    return base - (base * (disc / 100));
  };

  return (
    <div className="max-w-6xl mx-auto">
      
      {!selectedQuote ? (
        // --- LIST VIEW ---
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-[#0B132B] italic tracking-tight uppercase">BASE DE DATOS CRM</h2>
              <div className="flex gap-4">
                 <select className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 rounded-lg px-4 py-2 outline-none">
                    <option>-- Todos los Estados --</option>
                    <option>Nuevo</option>
                    <option>Vendido</option>
                 </select>
              </div>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b border-gray-100 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                   <th className="pb-4 font-black">Folio / Correo</th>
                   <th className="pb-4 font-black">Mes Consulta</th>
                   <th className="pb-4 font-black">Mes de Viaje</th>
                   <th className="pb-4 font-black">Estado</th>
                   <th className="pb-4 font-black text-right">Marketing / Acción</th>
                 </tr>
               </thead>
               <tbody>
                 {quotes.map(q => (
                   <tr key={q.id} className="border-b border-gray-50 hover:bg-orange-50/50 transition-colors">
                     <td className="py-4">
                        <div className="flex flex-col">
                           <span className="font-bold text-[#0B132B] text-sm">{q.id}</span>
                           <span className="text-xs text-gray-500 font-medium">{q.email}</span>
                        </div>
                     </td>
                     <td className="py-4 text-xs font-bold text-[#0B132B] uppercase">{q.monthQuery}</td>
                     <td className="py-4 text-xs font-bold text-orange-500 uppercase">{q.monthTravel}</td>
                     <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                          q.status === 'NUEVO' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {q.status}
                        </span>
                     </td>
                     <td className="py-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenQuote(q)}
                          className="bg-[#0B132B] hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold tracking-widest transition-colors flex items-center gap-2"
                        >
                          <FileText size={14} />
                          Abrir Ficha
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      ) : (
        // --- DETAIL VIEW (FICHA DE COTIZACIÓN) ---
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative">
           
           <button 
             onClick={() => setSelectedQuote(null)}
             className="absolute top-8 left-8 text-gray-400 hover:text-orange-500 flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-colors"
           >
             <ArrowLeft size={16} /> Volver al Listado
           </button>

           <div className="mt-12 mb-8 text-center max-w-xl mx-auto">
             <h2 className="text-2xl font-black text-[#0B132B] italic tracking-tight uppercase mb-2">FICHA DE COTIZACIÓN</h2>
             <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
               <span>Folio: <strong className="text-orange-500">{selectedQuote.id}</strong></span>
               <span>|</span>
               <span>Hotel: <strong className="text-[#0B132B]">{selectedQuote.details.hotel}</strong></span>
             </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12 bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Adultos</span>
                  <span className="font-black text-[#0B132B]">{selectedQuote.details.adults}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Niños</span>
                  <span className="font-black text-[#0B132B]">{selectedQuote.details.children}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Check IN</span>
                  <span className="font-black text-[#0B132B]">{selectedQuote.details.arrival}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Check OUT</span>
                  <span className="font-black text-[#0B132B]">{selectedQuote.details.departure}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-center">
                 <div className="mb-4">
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Descuento Especial (%)</label>
                   <input 
                     type="number" 
                     min="0" max="100"
                     value={discount}
                     onChange={(e) => setDiscount(Number(e.target.value))}
                     className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-[#0B132B] outline-none focus:border-orange-500 transition-colors"
                   />
                 </div>
                 <div className="bg-orange-50 p-4 rounded-lg flex justify-between items-center">
                   <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Total Cotizado</span>
                   <span className="text-2xl font-black text-[#0B132B] italic">${calculateTotal(selectedQuote.details.basePrice, discount).toFixed(2)}</span>
                 </div>
              </div>
           </div>

           <div className="flex justify-center mt-12">
             <button 
               onClick={() => setShowPreview(true)}
               className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold tracking-widest uppercase transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-3"
             >
               <Eye size={18} /> Validar y Previsualizar Envío
             </button>
           </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA (POP-UP) */}
      {showPreview && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/80 backdrop-blur-sm">
           <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                 <h3 className="text-sm font-black text-[#0B132B] tracking-widest uppercase flex items-center gap-2">
                   <Send size={16} className="text-orange-500" />
                   Vista Previa de Cotización PDF
                 </h3>
                 <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-[#0B132B] transition-colors">
                   <X size={24} />
                 </button>
              </div>

              {/* PDF EMULATION CANVAS */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-200">
                 <div className="bg-white w-full min-h-[500px] shadow-sm p-10 font-sans mx-auto">
                    {/* Header PDF */}
                    <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-orange-500">
                       <div className="flex items-center gap-3">
                          <div className="text-orange-500 font-bold text-3xl tracking-tighter flex items-center">
                              <span className="text-yellow-500">M</span>argarita
                          </div>
                       </div>
                       <div className="text-right text-[10px] text-gray-500 font-medium">
                         <p className="font-bold text-gray-800 text-sm mb-1">MARGARITA VIAJES C.A.</p>
                         <p>RIF J-40156646-4 | RTN 13314</p>
                         <p>Calle La Ceiba, Sector El Otro Lado del Río, La Asunción</p>
                         <p>Tel: +58 424-6861748 | cotizaciones@margaritaviajes.com</p>
                       </div>
                    </div>

                    {/* Meta PDF */}
                    <div className="bg-slate-100 p-3 mb-6 flex justify-between font-bold text-xs uppercase text-[#0B132B]">
                       <span>ESTIMADO CLIENTE: {selectedQuote.email}</span>
                       <span>FECHA: {new Date().toLocaleDateString('es-VE')}</span>
                    </div>

                    {/* Table PDF */}
                    <table className="w-full text-sm mb-8 border border-gray-200">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-bold bg-gray-50 w-1/4">Hotel/Servicio:</td>
                          <td className="p-3 text-orange-600 font-black">{selectedQuote.details.hotel}</td>
                          <td className="p-3 font-bold bg-gray-50 w-1/4">Check-In:</td>
                          <td className="p-3">{selectedQuote.details.arrival}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-bold bg-gray-50">Adultos / Niños:</td>
                          <td className="p-3">{selectedQuote.details.adults} / {selectedQuote.details.children}</td>
                          <td className="p-3 font-bold bg-gray-50">Check-Out:</td>
                          <td className="p-3">{selectedQuote.details.departure}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-bold bg-gray-50">Descuento aplicado:</td>
                          <td className="p-3 font-bold text-green-600">{discount}%</td>
                          <td className="p-3 font-bold bg-gray-50">Categoría:</td>
                          <td className="p-3 text-orange-600 font-bold">Estándar</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Total PDF */}
                    <div className="border border-orange-500 p-4 flex justify-between items-center">
                       <span className="font-black text-orange-600 text-lg uppercase tracking-widest">Total a Pagar</span>
                       <span className="font-black text-orange-600 text-2xl">${calculateTotal(selectedQuote.details.basePrice, discount).toFixed(2)}</span>
                    </div>
                    
                    <p className="text-[9px] font-bold text-red-600 text-center mt-12 uppercase">
                      PRECIOS Y DISPONIBILIDAD SUJETOS A CAMBIOS AL MOMENTO DE RESERVA Y EMISIÓN | CONSULTAR SIEMPRE ANTES DE REALIZAR EL PAGO.
                    </p>
                 </div>
              </div>

              <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-4">
                 <button onClick={() => setShowPreview(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs">
                   Cancelar
                 </button>
                 <button onClick={() => { setShowPreview(false); alert("¡Cotización Enviada al correo del cliente!"); setSelectedQuote(null); }} className="px-6 py-3 rounded-xl font-black text-white bg-green-500 hover:bg-green-600 transition-colors uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-green-500/30">
                   <Send size={16} /> Emitir y Enviar
                 </button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
}
