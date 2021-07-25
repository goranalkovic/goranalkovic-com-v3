<script>
	import { preferences, ThemeMode } from '../stores';

	const toggleTheme = () => {
		switch ($preferences.theme) {
			case ThemeMode.AUTO:
				preferences.set({ ...$preferences, theme: ThemeMode.LIGHT });
				break;
			case ThemeMode.LIGHT:
				preferences.set({ ...$preferences, theme: ThemeMode.DARK });
				break;
			case ThemeMode.DARK:
				preferences.set({ ...$preferences, theme: ThemeMode.AUTO });
				break;
		}
	};

    $: isDay = $preferences.theme === ThemeMode.LIGHT;
    $: isAuto = $preferences.theme === ThemeMode.AUTO;
    $: isNight = !isDay && !isAuto;
    $: rayTransform = isNight ? 6 : (isAuto ? 0.5 : 0);
    $: rayOpacity = isAuto ? 0.4 : (isDay ? 1 : 0);
    $: starScale = isDay || isAuto ? 0 : 1.25;

    const transitonDuration = 'duration-500';
</script>

<button class="" on:click={toggleTheme} >
    <svg class="w-36 h-36" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="sun-clip">
                <circle cx="12" cy="12" r="5.5" transform="scale(1.5)" style="transform-origin: center center"/>
            </clipPath>
        </defs>

        <path class="transition {transitonDuration}" d="M12 4V1" opacity={rayOpacity} transform="translate(0, {rayTransform})" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path class="transition {transitonDuration}" d="M12 23V20" opacity={rayOpacity} transform="translate(0, -{rayTransform})" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path class="transition {transitonDuration}" d="M20 12L23 12" opacity={rayOpacity} transform="translate(-{rayTransform}, 0)" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path class="transition {transitonDuration}" d="M1 12L4 12" opacity={rayOpacity} transform="translate({rayTransform}, 0)" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path class="transition {transitonDuration}" d="M17.657 6.34324L19.7783 4.22192" opacity={rayOpacity} transform="translate(-{rayTransform}, {rayTransform})" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path class="transition {transitonDuration}" d="M4.22194 19.7783L6.34326 17.657" opacity={rayOpacity} transform="translate({rayTransform}, -{rayTransform})" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path class="transition {transitonDuration}" d="M17.657 17.657L19.7783 19.7783" opacity={rayOpacity} transform="translate(-{rayTransform}, -{rayTransform})" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path class="transition {transitonDuration}" d="M4.22194 4.22194L6.34326 6.34326" opacity={rayOpacity} transform="translate({rayTransform}, {rayTransform})" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        
        <path class="transition {transitonDuration}" opacity={isNight ? 1 : 0} transform="translate(7.5, 7.5) scale({isNight ? 1.1 : 0.1})" fill-rule="evenodd" clip-rule="evenodd" d="M1.27586 9.42157C5.77489 9.42157 9.42208 5.77439 9.42208 1.27536C9.42208 0.841482 9.38816 0.415526 9.32282 0C11.5582 1.14832 13.0875 3.47707 13.0875 6.16301C13.0875 9.98719 9.98739 13.0873 6.16321 13.0873C3.47712 13.0873 1.14825 11.5578 0 9.32224C0.415685 9.38763 0.84181 9.42157 1.27586 9.42157Z" fill="currentColor" style="transform-origin: 40% 40%;"/>

        <path class="transition {transitonDuration}" transform="translate(8, 7.25) scale({isAuto ? 1 : 0})" d="M1.2002 7.8L2 5.72051M6.8 7.8L6.00035 5.72051M2 5.72051H6.00035M2 5.72051L4.0002 1L6.00035 5.72051" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="transform-origin: 15% 25%"/>
   
        <path class="transition {transitonDuration}" transform="translate({isNight ? 2.5 : 0.5}, {isNight ? 2.75 : 0.75}) scale({starScale})" d="M1.88373 1.8487L2.76761 2.73258M3.65149 3.61646L2.76761 2.73258M3.75002 1.75002L2.76761 2.73258M2.76761 2.73258L1.75 3.75" stroke="currentColor" stroke-linecap="round" style="transform-origin: 11% 12%;"/>
        <path class="transition {transitonDuration}" transform="translate({isNight ? 5.5 : 3.5}, {isNight ? 1.75 : 1.25}) scale({starScale})" d="M7.53059 3.81382L6.90559 4.89635M6.28059 5.97889L6.90559 4.89635M8.10894 5.59099L6.90559 4.89635M6.90559 4.89635L5.65946 4.17675" stroke="currentColor" stroke-linecap="round" style="transform-origin: 29% 21%;"/>
        <path class="transition {transitonDuration}" transform="translate({isNight ? 4 : 3.5}, {isNight ? 4.75 : 2.75}) scale({starScale})" d="M2.69123 6.6485L2.90829 7.87951M3.12535 9.11052L2.90829 7.87951M4.27661 7.63813L2.90829 7.87951M2.90829 7.87951L1.49115 8.12926" stroke="currentColor" stroke-linecap="round" style="transform-origin: 12% 33%"/>
        
    
        <circle class="transition {transitonDuration}" transform="scale({isAuto ? 1 : 0.714})" cx="12" cy="12" r="7" stroke="currentColor" stroke-width={isAuto ? 1.5 : 2.1} opacity={isDay || isAuto ? 1 : 0} style="transform-origin: center center"/>
    </svg>
    
</button>
