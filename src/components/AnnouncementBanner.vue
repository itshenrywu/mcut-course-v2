<script setup>
import { computed } from 'vue'
import { X } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { useAnnouncement, ANNOUNCEMENT_LABEL_CLASSES } from '@/lib/announcement'
import { spaceText } from '@/lib/utils'

const { current_announcement, dismissAnnouncement } = useAnnouncement()

const label_class = computed(() => ANNOUNCEMENT_LABEL_CLASSES[current_announcement.value?.severity] || ANNOUNCEMENT_LABEL_CLASSES.DEFAULT)
</script>

<template>
	<div
		v-if="current_announcement"
		class="relative bg-color-3 px-4 py-1.5 text-sm text-color-10"
	>
		<div
			:class="[
				'mx-auto max-w-5xl text-center leading-6',
				current_announcement.can_dismiss ? 'pr-6 md:pr-0' : '',
			]"
		>
			<p class="m-0">
				<Badge
					v-if="current_announcement.label"
					:class="[
						'mr-1 -translate-y-px border-transparent align-baseline',
						label_class,
					]"
				>
					{{ current_announcement.label }}
				</Badge>

				{{ spaceText(current_announcement.content) }}
			</p>
		</div>

		<button
			v-if="current_announcement.can_dismiss"
			type="button"
			aria-label="關閉公告"
			class="absolute top-1/2 right-4 -translate-y-1/2 rounded-sm p-1 text-color-7 hover:text-color-8"
			@click="dismissAnnouncement(current_announcement)"
		>
			<X class="size-4" />
		</button>
	</div>
</template>
