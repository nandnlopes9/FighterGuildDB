 // Adiciona efeito de parallax suave no scroll
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero-title h1');
            if (hero) {
                hero.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
        });

        // Animação de entrada para os cards
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observa todos os cards
        document.querySelectorAll('.game-card, .featured-card, .update-item').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });

        // Efeito de click nos cards
        document.querySelectorAll('.game-card, .featured-card').forEach(card => {
            card.addEventListener('click', function() {
                this.style.animation = 'pulse 0.4s ease';
                setTimeout(() => {
                    this.style.animation = '';
                }, 400);
            });
        });
