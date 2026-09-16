<script>
    import icons from "$lib/icons/index.js";
    import { fly } from "svelte/transition";

    let { class: classes, innerClass, containerClass, multiple = false, options, selected = $bindable() } = $props();
    let isOpen = $state(false);

    let buttonRef = $state();

    function reposition(node) {
        function update() {
            if (!buttonRef) return;

            const buttonRect = buttonRef.getBoundingClientRect();
            const dropdownRect = node.getBoundingClientRect();

            const spaceBelow = window.innerHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;

            if (spaceBelow < dropdownRect.height + 10 && spaceAbove > spaceBelow) {
                node.style.top = "auto";
                node.style.bottom = "100%";
                node.style.marginTop = "0";
                node.style.marginBottom = "0.5rem";
            } else {
                node.style.bottom = "auto";
                node.style.top = "100%";
                node.style.marginTop = "0.5rem";
                node.style.marginBottom = "0";
            }

            if (buttonRect.right - dropdownRect.width < 0) {
                node.style.right = "auto";
                node.style.left = "0";
            } else {
                node.style.left = "auto";
                node.style.right = "-0.75rem";
            }
        }

        requestAnimationFrame(update);

        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);

        return {
            destroy() {
                window.removeEventListener("scroll", update, true);
                window.removeEventListener("resize", update);
            },
        };
    }

    function handleSelect(e, option) {
        e.stopPropagation();
        
        if (multiple) {
            if (Array.isArray(selected)) {
                if (selected.includes(option)) {
                    selected = selected.filter((v) => v !== option);
                } else {
                    selected = [...selected, option];
                }
            } else {
                selected = [option];
            }
        } else {
            selected = option;
            isOpen = false;
        }
    }
</script>

<div class="relative flex items-center {classes}">
    {#if isOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="fixed inset-0 z-10" onclick={() => (isOpen = false)}></div>
    {/if}

    <button 
        type="button" 
        bind:this={buttonRef} 
        onclick={() => (isOpen = !isOpen)} 
        class="w-max flex items-center gap-2 hover:bg-stone-900 px-2 pl-3 py-1 rounded-xl hover:text-zinc-300 transition-colors cursor-pointer relative z-20 {innerClass}"
    >
        {#if multiple}
            {#if Array.isArray(selected) && selected.length > 0}
                {#if selected.length < 2}
                    <span>{selected.join(", ")}</span>
                {:else}
                    <span>{selected.length} Selected</span>
                {/if}
            {:else}
                <span>Select...</span>
            {/if}
        {:else}
            <span>{selected || "Select..."}</span>
        {/if}
        {@html icons.get("chevronRight", "size-4 rotate-90 transition-transform duration-150 " + (isOpen ? "-rotate-90" : ""))}
    </button>

    {#if isOpen}
        <div use:reposition transition:fly={{ y: 5, duration: 150 }} class="absolute bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden z-30 p-1 max-h-96 overflow-y-auto {containerClass}">
            {#if options.length === 0}
                <div class="px-3 py-2 text-sm text-zinc-400">No options available</div>
            {/if}
            {#each options as option}
                <button
                    type="button"
                    onclick={(e) => handleSelect(e, option)}
                    class="w-full text-left px-3 py-2 gap-2 text-sm rounded-lg text-zinc-300 hover:backdrop-blur-sm hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                >
                    <span class="truncate w-max">
                        {option}
                    </span>
                    
                    {#if multiple && Array.isArray(selected) && selected.includes(option)}
                        {@html icons.get("check", "size-4")}
                    {:else if !multiple && selected === option}
                        {@html icons.get("check", "size-4")}
                    {/if}
                </button>
            {/each}
        </div>
    {/if}
</div>