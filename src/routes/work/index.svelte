<script>
	import ArrowButton, { ArrowDirections } from '$lib/ArrowButton.svelte';
import ProjectSummary from '$lib/ProjectSummary.svelte';
</script>

<svelte:head>
	<title>Goran Alković | Work</title>
	<meta
		name="description"
		content="Goran Alković - a frontend developer that also likes to design."
	/>
</svelte:head>

<section class="my-180">
	<h1>Work</h1>
	<div class="flex gap-30">
		<ArrowButton content='Current' url='#current' arrowDirection={ArrowDirections.DOWN} />
		<ArrowButton content='Personal projects' url='#personal-projects' arrowDirection={ArrowDirections.DOWN} />
	</div>
</section>

<section id="current">
	<h2 class="purple-text">Current</h2>
	<ProjectSummary title="WordPress engineer" subtitle="Infinum" timeframe="from January 2021">
		I create custom WordPress block-based themes using Eightshift boilerplate. Main techologies used
		are React, PHP, HTML/CSS/JavaScript.
	</ProjectSummary>
</section>

<section id="student-jobs">
	<h2>Student jobs</h2>
	<ProjectSummary title="Digital designer" subtitle="Arbona" timeframe="July 2020 - November 2020">
		I designed online advertising materials, made dynamic Google Display ads and put together
		great-looking newsletters and Viber marketing campaigns.
	</ProjectSummary>
</section>

<section id="internships">
	<h2>Internships</h2>
	<ProjectSummary title="Summer internship" subtitle="Ekobit" timeframe="June 2019 - August 2019">
		I was a part of a team that worked on a company's project, used C# and SQL, learned a lot about
		optimizing SQL queries.
	</ProjectSummary>
</section>

<section id="freelancing">
	<h2>Freelancing</h2>
	<ProjectSummary
		title="Branding and a WordPress website"
		subtitle="SocialByte"
		timeframe="2020, 2021"
		button1Props={{
			content: 'Visit',
			url: 'https://socialbyte.agency',
			external: true,
			newTab: true
		}}
	>
		I designed a logo system for the agency, then set up a WordPress website, customized it, added
		custom content and did some basic SEO.
	</ProjectSummary>
	<ProjectSummary title="Promo materials" subtitle="Temple Bar" timeframe="March 2016 -">
		<span>I design promotional material for Facebook and Instagram ads for <i>Temple Bar</i> in Stubičke toplice.</span>
		<span>Previously Adobe Photoshop and Xd were used, now mostly working in Figma.</span>
	</ProjectSummary>
	<ProjectSummary
		title="Branding and bottle label design"
		subtitle="Aronija Juraj"
		timeframe="December 2018"
	>
		<span>I designed a logo, a simple brand system and bottle labels for <i>Aronija Juraj</i>.</span>
	</ProjectSummary>
</section>

<section id="during-my-studies">
	<h2>During my studies</h2>
	<ProjectSummary title="Lead designer" subtitle="STEM Games" timeframe="December 2018 - May 2019">
		I was the lead of a small design team; also worked on promotional materials, the event map,
		banners, accreditations, ...
	</ProjectSummary>
	<ProjectSummary
		title="Print design, lead designer"
		subtitle="ST@K"
		timeframe="January 2016 - September 2020"
	>
		
	<span>I was a part of the faculty magazine <i>St@k</i>. Started as a desginer, later lead the design
		team for a while (and still designed).</span>
	<span>Working in and leading a team helped me improve my
		teamwork and leadership skills.</span>
		<span>Magazine design was done in Adobe InDesign, together with Adobe Photoshop and Adobe Illustrator for
		supporting materials. Adobe Xd was used for some promotional materials.</span>
	</ProjectSummary>
	<div class="flex flex-col gap-30">
		<ProjectSummary
			title="Student council"
			subtitle="Faculty of organization and informatics"
			timeframe="March 2018 - September 2019"
		>
			I was a part of the Faculty of organization and informatics' Student council, where I worked
			on various projects.
		</ProjectSummary>
		<ProjectSummary subtitle="FOI Career week" timeframe="2016, 2017">
			I was a part of the Organization team, supporting all the event activities.
		</ProjectSummary>
		<ProjectSummary subtitle="Mladi pomažu" timeframe="December 2018">
			I created a logo and promotional materials for the student humanitarian action Mladi pomažu.
		</ProjectSummary>
		<ProjectSummary subtitle="Brucošijada grada Varaždina 2018" timeframe="October 2018">
			<span>I designed a logo, all the promotional materials and accrediations for the annual student
				welcoming party - <i>Brucošijada</i>.</span>
		</ProjectSummary>
		<ProjectSummary
			subtitle="Faculty of organization and informatics"
			timeframe="April 2018, April 2019"
		>
			I created promotional materials, t-shirt and banner designs for the Faculty of organization
			and informatics at STEM Games 2018 & 2019.
		</ProjectSummary>
	</div>
</section>

<section id="personal-projects">
	<h2 class="purple-text">Personal projects</h2>
	<ProjectSummary
		title="Browser piano"
		subtitle="Svelte, TailwindCSS"
		timeframe="2020, 2021"
		button1Props={{
			content: 'Check it out',
			url: 'https://piano.goranalkovic.com',
			external: true,
			newTab: true
		}}
		button2Props={{
			content: 'GitHub repo',
			url: 'https://github.com/goranalkovic/SimplePiano',
			external: true,
			newTab: true
		}}
	>
		A Svelte-based PWA that uses SoundFontPlayer to allow playing various combinations of
		instruments. Also, more advanced functionalities like one-button chords are available!
	</ProjectSummary>
	<ProjectSummary
		title="SVG2WP"
		subtitle="Svelte"
		timeframe="2021"
		button1Props={{
			content: 'Check it out',
			url: 'https://svg2wp.goranalkovic.com',
			external: true,
			newTab: true
		}}
		button2Props={{
			content: 'GitHub repo',
			url: 'https://github.com/goranalkovic/svg-to-wp',
			external: true,
			newTab: true
		}}
	>
		A simple tool that can optimize and prepare your SVGs for use in Gutenberg or the site itself.
	</ProjectSummary>
	<ProjectSummary
		title="Goc’s recipe book"
		subtitle="Svelte(Kit), TailwindCSS"
		timeframe="2021"
		button1Props={{
			content: 'Check it out',
			url: 'https://svg-2-wp.goranalkovic.com',
			external: true,
			newTab: true
		}}
		button2Props={{
			content: 'GitHub repo',
			url: 'https://github.com/goranalkovic/svg-to-wp',
			external: true,
			newTab: true
		}}
	>
		Website made to streamline preparing all the ingredients and make the preparation of various
		recipes easier by making everything simple, clean and effortless.
	</ProjectSummary>
	<ProjectSummary
		title="COVID-19 HR"
		subtitle="Flutter"
		timeframe="2020"
		button2Props={{
			content: 'GitHub repo',
			url: 'https://github.com/goranalkovic/covid19hr-flutter',
			external: true,
			newTab: true
		}}
	>
		A simple Flutter app to track COVID-19 cases in Croatia, made when the official one was very
		unpleasant to the eye.
	</ProjectSummary>
</section>

<style lang="postcss">
	section {
		scroll-margin-block-start: 3rem;
		@apply flex flex-col mb-120 gap-60;
	}

	@screen md {
		section {
			scroll-margin-block-start: 10rem;
		}
	}

	section h2 {
		@apply -mb-15 text-rich-purple-500 dark:text-rich-purple-300;
	}
</style>
