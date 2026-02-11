</main>
<script>
    // Close flash messages after 5 seconds
    document.querySelectorAll('.flash').forEach(el => {
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 5000);
    });
</script>
</body>

</html>