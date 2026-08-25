import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
	'inline-flex items-center justify-center rounded-md border font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-color-5 focus-visible:ring-color-5/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive overflow-hidden',
	{
		variants: {
			variant: {
				default: 'border-transparent bg-color-10 text-color-1 [a&]:hover:bg-color-10/90',
				secondary: 'border-transparent bg-color-3 text-color-9 [a&]:hover:bg-color-3/90',
				destructive: 'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90',
				outline: 'border-color-4 text-color-10 [a&]:hover:bg-color-2 [a&]:hover:text-color-10'
			},
			size: {
				default: 'px-2 py-0.5 text-xs',
				sm: 'px-1.5 py-0 text-[10px] leading-4'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	}
)
