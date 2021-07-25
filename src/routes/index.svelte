<script>
	import ArrowButton, { ArrowDirections } from '$lib/ArrowButton.svelte';
	import AboutImage from '$lib/AboutImage.svelte';
	import WorkShowcaseCard from '$lib/WorkShowcaseCard.svelte';
</script>

<svelte:head>
	<title>Goran Alković - Developer & designer</title>
	<meta name="description" content="Goran Alković - a frontend developer that also likes to design.">
</svelte:head>

<section id="intro" class="mt-120 md:mt-60 mb-100 md:mb-100">
	<h1 class="text-48 md:text-96 font-bold max-w-[68rem]">
		<span class="text-transparent text-stroke-black dark:text-stroke-white text-stroke-DEFAULT">
			Hi! I'm Goran.
		</span>
		<br />
		A <span class="purple-text">frontend developer</span> that also likes to design.
	</h1>

	<ArrowButton
		content="Learn more about me"
		url="#about"
		arrowDirection={ArrowDirections.DOWN}
		extraClass="mt-30 md:mt-60"
	/>
</section>

<section class="lg:flex lg:flex-row-reverse lg:-mr-30" id="about">
	<AboutImage />
	<div class="flex flex-col gap-15 max-w-lg lg:max-w-420 md:mr-px">
		<h2 class="text-40 md:text-80 mt-48 lg:mt-0 mb-15 lg:mb-30 font-bold">
			<span class="purple-text">About</span> me
		</h2>
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
		<ArrowButton content="Explore my work" url="#work" extraClass="mt-15" arrowDirection={ArrowDirections.DOWN} />
	</div>
</section>

<section class="sm:grid sm:grid-cols-2 sm:gap-30 sm:auto-rows-auto" id="work">
	<h2 class="text-40 md:text-80 mt-48 sm:mt-0 mb-15 font-bold sm:max-w-sm">
		Some of my <span class="purple-text">work</span>
	</h2>
	<WorkShowcaseCard
		name="Goc's recipe book"
		url="#"
		imageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-light_CBuuzFsxnI.png?updatedAt=1627165988227"
		mobileImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-mobile-light_XWcpickYcWy.png?updatedAt=1627165988012"
		darkImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-dark_dxtEc90MB.png?updatedAt=1627165987564"
		darkMobileImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/recipes-mobile-dark_zfLf4dnSHD.png?updatedAt=1627165987852"
		desktopTextVerAlignBottom
		extraClass='sm:col-start-2 sm:row-start-1 sm:row-span-2'
		lightColor='#CE0F4C'
	/>
	<WorkShowcaseCard
		name="SocialByte"
		url="#"
		imageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-light_6Fs5-KvVHZ.png?updatedAt=1627165987943"
		mobileImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-mobile-light_46G2pDGDGZ6.png?updatedAt=1627165988015"
		darkImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-dark_KM_w1H6OX.png?updatedAt=1627165987738"
		darkMobileImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/socialbyte-mobile-dark_QZq8k78asl.png?updatedAt=1627165987903"
		desktopTextHorAlignEnd
		desktopTextVerAlignBottom
	/>
	<WorkShowcaseCard
		name="STEM Games 2019"
		url="#"
		imageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-light_k4ULUo0nk8.png?updatedAt=1627165989027"
		mobileImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-mobile-light_13ucLiqCy.png?updatedAt=1627165989031"
		darkImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-dark_kgvG_ykqN.png?updatedAt=1627165988771"
		darkMobileImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/stemgames-mobile-dark_1hAUMDfN0W.png?updatedAt=1627165988788"
		desktopTextHorAlignEnd
		extraClass='sm:row-span-2'
		lightColor='#06354A'
	/>
	<WorkShowcaseCard
		name="Browser piano"
		url="#"
		imageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-light_UmAFBIU3D.png?updatedAt=1627165985952"
		mobileImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-mobile-light_unCuRJAfVG.png?updatedAt=1627165986293"
		darkImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-dark_Kr8fRagSe6.png?updatedAt=1627165985722"
		darkMobileImageUrl="https://ik.imagekit.io/goranalkovic/personal_web/homepage/tr:n-home_workcard/piano-mobile-dark_yIBhRQQBTG.png?updatedAt=1627165986143"
	/>
</section>

<style>
	section {
		@apply pt-120 md:pt-180 pb-60 md:pb-60;
	}
	#about p {
		@apply text-14 md:text-18;
	}

	a.underline {
		text-decoration-color: #322eff;
		text-underline-offset: 0.1em;
		text-decoration-thickness: 2px;
	}

	@media (prefers-color-scheme: dark) {
		a.underline {
			text-decoration-color: #7270ff;
		}
	}
</style>
