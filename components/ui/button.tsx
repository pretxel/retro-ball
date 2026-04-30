import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "btn-riso group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap select-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "",
        outline: "btn-riso--outline",
        secondary: "btn-riso--secondary",
        ghost: "btn-riso--ghost",
        destructive: "btn-riso--destructive",
        link: "bg-transparent border-0 text-[var(--ink)] underline underline-offset-4 hover:bg-transparent normal-case tracking-normal p-0 h-auto",
      },
      size: {
        default: "px-4 py-2 text-xs",
        xs: "btn-riso--sm px-2 py-1 text-[0.65rem]",
        sm: "btn-riso--sm",
        lg: "px-5 py-3 text-sm",
        icon: "size-9 p-0",
        "icon-xs": "size-7 p-0",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
