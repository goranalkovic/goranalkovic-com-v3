<script>
	import ArrowButton, { ArrowDirections } from '$lib/ArrowButton.svelte';
	import AboutImage from '$lib/AboutImage.svelte';
	import WorkShowcaseCard from '$lib/WorkShowcaseCard.svelte';
	import ContactItem from '$lib/ContactItem.svelte';
</script>

<svelte:head>
	<title>Goran Alković | Developer & designer</title>
	<meta
		name="description"
		content="Goran Alković - a frontend developer that also likes to design."
	/>
</svelte:head>

<section id="intro" class="content-padding h-[90vh] !py-0 flex flex-col justify-center">
	<h1 class="max-w-[68rem]">
		<span class="block text-transparent text-stroke-1 text-stroke-black dark:text-stroke-white">
			Hi! I'm Goran.
		</span>
		<span class="block">
			A <span class="purple-text">frontend developer</span> that also likes to design.
		</span>
	</h1>

	<ArrowButton
		content="Learn more about me"
		url="#about"
		arrowDirection={ArrowDirections.DOWN}
		extraClass="mt-30 md:mt-60"
	/>
</section>

<section
	class="content-padding lg:flex lg:flex-row-reverse md:col-start-2 md:col-span-2"
	id="about"
>
	<AboutImage />
	<div class="flex flex-col gap-15 max-w-lg lg:max-w-420 md:mr-px mt-30 sm:mt-60 lg:mt-0 lg:mr-30">
		<h2><span class="purple-text">About</span> me</h2>
		<p>
			I’m a frontend developer who also likes to design. My philosophy is that everything should be
			visually pleasing and easy to use, besides just doing its job.
		</p>
		<p>
			Throughout the years I tried a lot of technologies and fields in development, but what won at
			the end was web development (mostly frontend).
		</p>
		<p>
			Design-wise I’ve done some print design, but mostly I’ve worked on digital design and UI/UX
			for my personal projects.
		</p>
		<p>
			Currently working at <a class="underline " href="https://infinum.com">Infinum</a> as a WordPress
			engineer, where I create custom Gutenberg block themes and work on the open-source Eightshift boilerplate.
		</p>
		<p>
			In my free time I love to drink coffee, explore what’s new in tech, make crazy projects and
			game a bit here and there.
		</p>
		<ArrowButton content="Read my CV" url="/about" extraClass="mt-15 md:mt-30" />
		<ArrowButton
			content="Explore my work"
			url="#work"
			extraClass="mt-15"
			arrowDirection={ArrowDirections.DOWN}
		/>
	</div>
</section>

<section class="content-padding" id="work">
	<div class="sm:grid sm:grid-cols-2 sm:gap-15 md:gap-30 lg:grid-rows-[min,1fr,1fr,6rem]">
		<h2 class="mb-30 sm:mb-15 md:mb-0 sm:col-span-2 lg:col-span-1">
			Some of my <span class="purple-text">work</span>
		</h2>
		<WorkShowcaseCard
			name="Goc's recipe book"
			url="https://recipes.goranalkovic.com"
			imageFilename="recipes"
			desktopTextVerAlignBottom
			extraClass="lg:col-start-2 lg:row-start-1 lg:row-span-2"
			lightColor="#CE0F4C"
		/>
		<WorkShowcaseCard
			name="SocialByte"
			url="https://socialbyte.agency"
			imageFilename="socialbyte"
			desktopTextHorAlignEnd
			desktopTextVerAlignBottom
		/>
		<WorkShowcaseCard
			name="STEM Games 2019"
			url="#"
			imageFilename="stemgames"
			desktopTextHorAlignEnd
			extraClass="md:row-span-2"
			lightColor="#06354A"
		/>
		<WorkShowcaseCard
			name="Browser piano"
			url="https://piano.goranalkovic.com"
			imageFilename="piano"
		/>
		<ArrowButton
			content="See more"
			url="/work"
			extraClass="mt-15 sm:mt-30 md:mt-0 sm:col-start-1 lg:col-start-2 sm:!w-full h-full lg:justify-center rounded-md lg:border lg:border-gray-200 lg:hover:border-rich-purple-500 lg:hover:border-opacity-50 lg:dark:border-rich-purple-300 lg:dark:border-opacity-10 lg:dark:hover:border-opacity-50 lg:dark:hover:border-rich-purple-300 !transition"
		/>
	</div>
</section>

<section id="contact" class="content-padding mb-[20vh]">
	<h2><span class="purple-text">Contact</span> & socials</h2>

	<div
		class="flex flex-col gap-30 mt-30 sm:mt-60 md:grid md:grid-cols-2 lg:grid-rows-2 lg:auto-cols-fr lg:grid-flow-col md:gap-x-30 md:gap-y-48 lg:gap-y-60 w-full"
	>
		<ContactItem
			title="E-mail"
			contact="contact@goranalkovic.com"
			buttonCaption="Send an email"
			buttonUrl="mailto:contact@goranalkovic.com"
		/>
		<ContactItem
			title="Phone"
			contactPrefix="+385 "
			contact="976 480 800"
			buttonCaption="Open in dialer"
			buttonUrl="tel:+385976480800"
		/>
		<ContactItem
			title="GitHub"
			contactPrefix="github.com/"
			contact="goranalkovic"
			buttonCaption="View my repos"
			buttonUrl="https://github.com/goranalkovic"
		/>
		<ContactItem
			title="LinkedIn"
			contactPrefix="linkedin.com/in/"
			contact="goran-alković-b9569379"
			buttonCaption="Connect with me"
			buttonUrl="https://www.linkedin.com/in/goran-alkovi%C4%87-b9569379"
		/>
		<div class="lg:row-span-2">
			<ContactItem
				title="Unsplash"
				contactPrefix="unsplash.com/"
				contact="@goran_alkovic"
				buttonCaption="Explore my photos"
				buttonUrl="https://unsplash.com/@goran_alkovic"
			/>
			<div class="grid grid-cols-3 gap-15 w-full max-w-xs mt-30">
				<img
					class="rounded object-cover select-none"
					src="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/unsplash-1_g3R9aJ96u.png?updatedAt=1627165984534"
					alt="My dog"
				/>
				<img
					class="rounded object-cover select-none"
					src="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/unsplash-2_gwmIcs_7yi.png?updatedAt=1627165984655"
					alt="Food on a table"
				/>
				<img
					class="rounded object-cover select-none"
					src="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-180_square/unsplash-3_va-tBjnDmh.png?updatedAt=1627165984865"
					alt="Sunset at the Varaždin student dorm"
				/>
			</div>
		</div>
	</div>
</section>

<style lang="postcss">
	section {
		@apply pt-120 md:pt-180 pb-60 md:pb-60;
	}
	#about p {
		@apply text-14 md:text-18 transition-colors;
	}
</style>
