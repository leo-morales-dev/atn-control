"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Loader2, UploadCloud, FileDown } from "lucide-react"
import { toast } from "sonner"
import { importProductsFromExcel } from "@/app/actions/import-excel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ExcelImport() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDownloadTemplate = () => {
    const headers = ["CODIGO", "CLAVE_PROV", "DESCRIPCION", "CATEGORIA", "STOCK", "MINIMO"]
    const example = ["HER-001", "TAL-500", "TALADRO INDUSTRIAL", "Herramienta", 10, 2]
    
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    
    const wscols = [
      {wch: 15}, {wch: 15}, {wch: 35}, {wch: 15}, {wch: 10}, {wch: 10}
    ]
    ws['!cols'] = wscols

    XLSX.utils.book_append_sheet(wb, ws, "Plantilla")
    XLSX.writeFile(wb, "plantilla_inventario.xlsx")
    toast.success("Plantilla descargada")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        toast.error("El archivo está vacío")
        setLoading(false)
        return
      }

      const cleanData = JSON.parse(JSON.stringify(jsonData))
      const result = await importProductsFromExcel(cleanData)

      if (result.success) {
        toast.success(`Importación completada: ${result.count} productos procesados.`)
        setOpen(false)
      } else {
        toast.error(result.error || "Error al importar")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error al leer el archivo Excel")
    } finally {
      setLoading(false)
      e.target.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* BOTÓN EXCEL: Rojo, Ancho Fijo, Sin size="sm" */}
        <Button 
            className="h-10 w-[140px] gap-2 bg-[#de2d2d] text-white hover:bg-[#de2d2d]/90 shadow-sm px-3 font-medium border-none"
        >
            <FileSpreadsheet size={16} /> Importar Excel
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="text-green-600"/> Importar desde Excel
          </DialogTitle>
          <DialogDescription>
            Sube tu archivo para importar productos masivamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-2 p-3 bg-green-50 rounded-lg border border-green-100 text-green-900 text-sm">
                <div className="flex items-center gap-2 font-medium">
                    <FileDown size={16} className="text-green-600"/>
                    ¿No tienes el formato correcto?
                </div>
                <p className="text-xs text-green-700 ml-6 mb-1">
                    Descarga la plantilla oficial, llénala con tus productos y súbela aquí.
                </p>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownloadTemplate}
                    className="ml-6 w-fit h-7 text-xs bg-white border-green-200 hover:bg-green-100 text-green-700 hover:text-green-800"
                >
                    Descargar Plantilla .xlsx
                </Button>
            </div>

            <div>
                <p className="text-xs text-zinc-500 mb-2">
                    Selecciona tu archivo (.xlsx):
                </p>
                <div className="flex flex-col items-center justify-center gap-4 py-6 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer relative">
                    {loading ? (
                        <div className="flex flex-col items-center gap-2 text-zinc-500">
                            <Loader2 className="animate-spin h-8 w-8 text-green-600" />
                            <p className="text-sm">Procesando archivo...</p>
                        </div>
                    ) : (
                        <>
                            <UploadCloud className="h-10 w-10 text-zinc-300" />
                            <div className="text-center space-y-1">
                                <p className="text-sm font-medium text-zinc-700">Haz clic para seleccionar</p>
                                <p className="text-xs text-zinc-400">Asegúrate de que las columnas coincidan.</p>
                            </div>
                            <input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={loading}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}