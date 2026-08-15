<script setup>
const IS_DEV = import.meta.env.DEV
</script>

<template>
	<div
		v-if="IS_DEV"
		class="fixed bottom-0 left-0 z-50 flex size-7 items-center justify-center bg-color-10 font-mono text-xs font-bold text-color-1 opacity-80"
	>
		<span class="sm:hidden">xs</span>
		<span class="hidden sm:inline md:hidden">sm</span>
		<span class="hidden md:inline lg:hidden">md</span>
		<span class="hidden lg:inline xl:hidden">lg</span>
		<span class="hidden xl:inline 2xl:hidden">xl</span>
		<span class="hidden 2xl:inline">2xl</span>
	</div>
</template>
