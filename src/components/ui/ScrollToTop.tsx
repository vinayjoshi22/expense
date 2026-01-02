import { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    // Toggle visibility
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    // Scroll to top
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (!isVisible) {
        return null;
    }

    return (
        <Button
            variant="secondary"
            onClick={scrollToTop}
            className="position-fixed bottom-0 end-0 m-4 rounded-circle p-2 shadow"
            style={{
                zIndex: 1050,
                width: '45px',
                height: '45px',
                opacity: 0.6, // Semi-transparent
                transition: 'opacity 0.3s ease-in-out, transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'; // Opaque on hover
                e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="Scroll to top"
        >
            <ArrowUp size={20} />
        </Button>
    );
}
