import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-color-5 focus-visible:ring-color-5/50 focus-visible:ring-[3px]",
	{
		variants: {
			variant: {
				default: 'bg-color-10 text-color-1 shadow-xs hover:bg-color-10/90',
				destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90',
				outline: 'border bg-color-2 shadow-xs hover:bg-color-2 hover:text-color-10',
				secondary: 'bg-color-2 text-color-10 shadow-xs hover:bg-color-2/80',
				ghost: 'hover:bg-color-2 hover:text-color-10',
				'destructive-ghost': 'text-destructive hover:bg-destructive/10',
				link: 'text-color-10 underline-offset-4 hover:underline'
			},
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
				lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
				icon: 'size-9'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	}
)
