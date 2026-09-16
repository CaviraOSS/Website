<script>
    let cursorWrapper;
    let dotRef;

    let isHovering = $state(false);

    $effect(() => {
        let mouse = { x: -100, y: -100 };
        let pos = { x: -100, y: -100 };
        let rafId;

        const onMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;

            if (dotRef) {
                dotRef.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
            }
        };

        const render = () => {
            pos.x += (mouse.x - pos.x) * 0.15;
            pos.y += (mouse.y - pos.y) * 0.15;

            if (cursorWrapper) {
                cursorWrapper.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
            }

            rafId = requestAnimationFrame(render);
        };

        const handleMouseOver = (e) => {
            if (e.target.closest('a, button, input, textarea, [data-cursor="hover"]')) {
                isHovering = true;
            }
        };

        const handleMouseOut = (e) => {
            if (e.target.closest('a, button, input, textarea, [data-cursor="hover"]')) {
                isHovering = false;
            }
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseover", handleMouseOver);
        window.addEventListener("mouseout", handleMouseOut);
        
        rafId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseover", handleMouseOver);
            window.removeEventListener("mouseout", handleMouseOut);
            cancelAnimationFrame(rafId);
        };
    });
</script>

<div
    bind:this={dotRef}
    class="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[9999] -ml-[3px] -mt-[3px] mix-blend-difference"
></div>

<div
    bind:this={cursorWrapper}
    class="fixed top-0 left-0 pointer-events-none z-[9998] mix-blend-difference"
>
    <div 
        class="w-8 h-8 border border-white rounded-full -ml-4 -mt-4 transition-all duration-300 ease-out"
        class:scale-[1.8]={isHovering}
        class:bg-white={isHovering}
        class:border-transparent={isHovering}
    ></div>
</div>

<style>
    :global(body),
    :global(body *) {
        cursor: none !important;
    }
</style>