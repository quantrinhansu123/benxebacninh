import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { MoreVertical, Eye, Edit, Trash2, X, Plus } from "lucide-react"
import { Button } from "./button"

export interface ActionMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: "default" | "danger" | "warning" | "info"
  disabled?: boolean
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  className?: string
}

export function ActionMenu({ items, className = "" }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function updateMenuPosition() {
      if (buttonRef.current && isOpen) {
        const rect = buttonRef.current.getBoundingClientRect()
        const menuWidth = 192 // w-48 = 192px
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Calculate left position - align to right edge of button
        let left = rect.right - menuWidth
        
        // If menu would go off screen, align to left edge of button instead
        if (left < 8) {
          left = rect.left
        }
        
        // If still off screen, adjust
        if (left + menuWidth > viewportWidth - 8) {
          left = viewportWidth - menuWidth - 8
        }
        
        // Calculate top position
        let top = rect.bottom + 4
        
        // If menu would go off bottom of screen, show above button
        const menuHeight = items.length * 40 + 8 // approximate height
        if (top + menuHeight > viewportHeight - 8) {
          top = rect.top - menuHeight - 4
        }
        
        // Ensure menu is not off top of screen
        if (top < 8) {
          top = 8
        }
        
        setMenuPosition({ top, left })
      }
    }

    if (isOpen) {
      // Calculate position immediately and after a small delay to ensure DOM is ready
      updateMenuPosition()
      const timeoutId = setTimeout(() => {
        updateMenuPosition()
      }, 0)
      
      // Add listeners
      document.addEventListener("mousedown", handleClickOutside)
      window.addEventListener("scroll", updateMenuPosition, true)
      window.addEventListener("resize", updateMenuPosition)
      
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener("mousedown", handleClickOutside)
        window.removeEventListener("scroll", updateMenuPosition, true)
        window.removeEventListener("resize", updateMenuPosition)
      }
    }

  }, [isOpen, items.length])

  const handleItemClick = (item: ActionMenuItem) => {
    if (!item.disabled) {
      item.onClick()
      setIsOpen(false)
    }
  }

  const getItemStyles = (variant?: string) => {
    switch (variant) {
      case "danger":
        return "text-red-600 hover:bg-red-50"
      case "warning":
        return "text-amber-600 hover:bg-amber-50"
      case "info":
        return "text-blue-600 hover:bg-blue-50"
      default:
        return "text-slate-600 hover:bg-slate-50"
    }
  }

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className="h-8 w-8 p-0"
          aria-label="Thao tác"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu - Portal to body to avoid overflow issues */}
          <div 
            ref={menuRef}
            className="fixed w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-[9999] py-1"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  handleItemClick(item)
                }}
                disabled={item.disabled}
                className={`
                  w-full px-4 py-2 text-sm text-left flex items-center gap-2 transition-colors
                  ${getItemStyles(item.variant)}
                  ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                {item.icon || (
                  item.label === "Xem" || item.label === "Xem chi tiết" ? <Eye className="h-4 w-4" /> :
                  item.label === "Sửa" || item.label === "Chỉnh sửa" ? <Edit className="h-4 w-4" /> :
                  item.label === "Xóa" ? <Trash2 className="h-4 w-4" /> :
                  item.label.includes("Vô hiệu") || item.label.includes("Kích hoạt") ? (
                    item.label.includes("Vô hiệu") ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />
                  ) : null
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  )
}
