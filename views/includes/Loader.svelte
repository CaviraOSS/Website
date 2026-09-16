<script>
    import { onMount } from "svelte";

    let logo;
    let text;
    let box;
    let hider;
    let boxes;
    let loader;

    onMount(() => {
        // Initial setup
        Array.from(logo.children).forEach((i) => {
            i.classList.add("duration-1000", "transition-all");
        });
        Array.from(text.children).forEach((i) => {
            i.classList.add("duration-1000", "transition-all");
        });

        box.classList.remove("translate-y-36");

        Array.from(logo.children).forEach((i, index) => {
            setTimeout(() => {
                i.classList.remove("opacity-0");
            }, index * 200);
        });

        let texts = Array.from(text.children);

        setTimeout(
            () => {
                logo.classList.add("-translate-x-64");
                logo.classList.remove("rotate-90");

                setTimeout(() => {
                    text.classList.remove("opacity-0");
                    text.classList.add("translate-x-28");

                    texts.forEach((i, index) => {
                        setTimeout(() => {
                            i.classList.remove("translate-y-36");
                        }, index * 80);
                    });

                    setTimeout(
                        () => {
                            logo.classList.remove("bg-black");
                            hider.classList.add("hidden");

                            setTimeout(() => {
                                let boxesl = Array.from(boxes.children).reverse();
                                boxesl.forEach((j) => {
                                    j.classList.add("duration-700", "transition-all");
                                });

                                box.classList.add("duration-500", "transition-all");

                                setTimeout(() => {
                                    box.classList.add("opacity-0");
                                }, 300);

                                boxesl.forEach((j, ij) => {
                                    setTimeout(() => {
                                        j.classList.add("h-0");
                                        j.classList.remove("bg-black");
                                    }, ij * 80);
                                });

                                setTimeout(
                                    () => {
                                        loader.classList.add("hidden");
                                        
                                        Array.from(logo.children).forEach((i) => {
                                            i.classList.remove("duration-1000", "transition-all");
                                            i.classList.add("opacity-0");
                                        });

                                        logo.classList.add("rotate-90", "bg-black");
                                        logo.classList.remove("-translate-x-64");

                                        texts.forEach((i) => {
                                            i.classList.remove("duration-1000", "transition-all");
                                            i.classList.add("translate-y-36");
                                        });

                                        text.classList.add("opacity-0");
                                        text.classList.remove("translate-x-28");
                                        
                                        Array.from(boxes.children).forEach((i) => {
                                            i.classList.remove("duration-700", "transition-all", "h-0");
                                            i.classList.add("bg-black");
                                        });

                                        box.classList.remove("duration-500", "transition-all", "opacity-0");
                                        box.classList.add("translate-y-36");
                                        hider.classList.remove("hidden");
                                    },
                                    boxesl.length * 80 + 500
                                );
                            }, 200);
                        },
                        texts.length * 80 + 500
                    );
                }, 200);
            },
            text.childElementCount * 50 + 400
        );
    });
</script>

<section bind:this={loader} class="w-screen h-screen flex items-center justify-center text-white relative overflow-hidden">
	<div bind:this={boxes} class="absolute w-screen h-screen grid grid-cols-12 items-end">
		{#each Array(12) as _, i}
			<div class="h-full w-full bg-[#060606]"></div>
		{/each}
	</div>

	<div bind:this={box} class="flex items-center justify-center duration-1000 transition-all translate-y-36">
		<svg bind:this={logo} class="size-40 rotate-90 z-20 duration-1000 transition-all" viewBox="0 0 389 361" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				class="opacity-0"
				d="M179.142 64C179.471 64.6289 180.376 64.6141 180.682 63.9737C189.139 46.262 198.901 25.6521 208.429 5.68777C210.088 2.21157 213.597 0 217.449 0H241.718C249.094 0 253.932 7.7133 250.72 14.3538L201.391 116.354C199.721 119.806 196.223 122 192.388 122H168.707C164.872 122 161.375 119.806 159.705 116.354L110.375 14.3538C107.164 7.7133 112.001 0 119.378 0H143.135C147.032 0 150.574 2.26375 152.21 5.80033L179.142 64Z"
				fill="currentColor"
			/>
			<path
				class="opacity-0"
				d="M269.376 116.783C268.996 117.382 269.461 118.159 270.169 118.103C289.736 116.571 312.466 114.721 334.519 112.99C338.359 112.689 342.029 114.622 343.955 117.958L356.089 138.975C359.777 145.363 355.516 153.409 348.16 153.948L235.16 162.228C231.335 162.508 227.687 160.576 225.769 157.254L213.929 136.746C212.011 133.425 212.162 129.299 214.317 126.127L277.987 32.406C282.132 26.3046 291.231 26.6375 294.919 33.0255L306.798 53.5999C308.746 56.9747 308.557 61.174 306.312 64.3596L269.376 116.783Z"
				fill="currentColor"
			/>
			<path
				class="opacity-0"
				d="M270.781 224.783C270.072 224.754 269.632 225.545 270.034 226.13C281.144 242.309 294.112 261.069 306.638 279.302C308.819 282.477 308.979 286.622 307.053 289.958L294.919 310.975C291.231 317.363 282.132 317.696 277.987 311.594L214.317 217.874C212.162 214.701 212.011 210.576 213.929 207.254L225.769 186.746C227.687 183.425 231.335 181.493 235.16 181.773L348.159 190.052C355.516 190.591 359.777 198.637 356.089 205.026L344.21 225.6C342.262 228.975 338.531 230.91 334.649 230.559L270.781 224.783Z"
				fill="currentColor"
			/>
			<path
				class="opacity-0"
				d="M181.953 280C181.624 279.371 180.719 279.386 180.413 280.026C171.957 297.738 162.194 318.348 152.666 338.312C151.007 341.788 147.498 344 143.646 344H119.378C112.001 344 107.164 336.287 110.375 329.646L159.705 227.646C161.374 224.194 164.872 222 168.707 222H192.388C196.223 222 199.721 224.194 201.391 227.646L250.72 329.646C253.932 336.287 249.094 344 241.718 344H217.96C214.063 344 210.521 341.736 208.885 338.2L181.953 280Z"
				fill="currentColor"
			/>
			<path
				class="opacity-0"
				d="M91.7197 227.217C92.1 226.618 91.6347 225.842 90.9272 225.897C71.3599 227.429 48.6299 229.279 26.5766 231.011C22.7366 231.312 19.0666 229.378 17.1407 226.043L5.00643 205.025C1.31828 198.637 5.57937 190.591 12.9359 190.052L125.935 181.773C129.76 181.493 133.409 183.425 135.326 186.746L147.167 207.254C149.084 210.576 148.933 214.701 146.778 217.874L83.1084 311.594C78.9633 317.696 69.8645 317.363 66.1764 310.975L54.2978 290.401C52.3493 287.026 52.5388 282.827 54.7833 279.641L91.7197 227.217Z"
				fill="currentColor"
			/>
			<path
				class="opacity-0"
				d="M90.3142 119.217C91.0232 119.246 91.4628 118.455 91.0611 117.87C79.9508 101.691 66.9834 82.931 54.4575 64.6978C52.2765 61.523 52.116 57.3779 54.0419 54.0422L66.1762 33.025C69.8643 26.6369 78.9631 26.304 83.1082 32.4055L146.778 126.126C148.933 129.299 149.084 133.424 147.167 136.746L135.326 157.254C133.408 160.575 129.76 162.507 125.935 162.227L12.9357 153.948C5.57915 153.409 1.31807 145.363 5.00622 138.974L16.8848 118.4C18.8333 115.025 22.5647 113.09 26.4458 113.441L90.3142 119.217Z"
				fill="currentColor"
			/>
		</svg>
		<div bind:this={text} class="flex items-center z-10 absolute opacity-0 font-normal font-funnel -mt-2">
			{#each "Cavira".split("") as letter}
				<h1 class="text-[10.6rem] translate-y-36">{letter}</h1>
			{/each}
		</div>
	</div>

	<div bind:this={hider} class="absolute bg-[#060606] w-screen h-96 translate-y-64 z-30"></div>
</section>
