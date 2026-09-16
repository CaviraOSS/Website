<script>
    let { checked = $bindable(false), disabled = false } = $props();
</script>

<label class="relative cursor-pointer shrink-0">
    <input 
        type="checkbox" 
        class="peer sr-only" 
        {checked} 
        {disabled} 
        onchange={(e) => (checked = e.currentTarget.checked)}
    />
    <div
        class="w-9 h-5 bg-zinc-800 rounded-full transition-colors duration-200 peer-checked:bg-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-zinc-500 after:peer-checked:bg-black after:transition-all after:duration-200 peer-checked:after:translate-x-4"
    ></div>
</label>