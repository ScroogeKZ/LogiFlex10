import { TruckIcon } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t bg-card mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TruckIcon className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">LogiFlex.kz</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Надежная логистическая платформа для Казахстана с государственной интеграцией
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Платформа</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/cargo" 
                  className="text-muted-foreground hover:text-foreground transition-colors block"
                >
                  Найти грузы
                </Link>
              </li>
              <li>
                <Link 
                  href="/carriers" 
                  className="text-muted-foreground hover:text-foreground transition-colors block"
                >
                  Найти перевозчиков
                </Link>
              </li>
              <li>
                <Link 
                  href="/pricing" 
                  className="text-muted-foreground hover:text-foreground transition-colors block"
                >
                  Тарифы
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Компания</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/about" 
                  className="text-muted-foreground hover:text-foreground transition-colors block"
                >
                  О нас
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-muted-foreground hover:text-foreground transition-colors block"
                >
                  Контакты
                </Link>
              </li>
              <li>
                <Link 
                  href="/blog" 
                  className="text-muted-foreground hover:text-foreground transition-colors block"
                >
                  Блог
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Поддержка</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/help" 
                  className="text-muted-foreground hover:text-foreground transition-colors block"
                >
                  Центр помощи
                </Link>
              </li>
              <li>
                <Link 
                  href="/docs" 
                  className="text-muted-foreground hover:text-foreground transition-colors block"
                >
                  Документация
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-muted-foreground hover:text-foreground transition-colors block"
                >
                  Конфиденциальность
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 LogiFlex.kz. Все права защищены.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Интеграция с eGov.kz</span>
            <span>•</span>
            <span>ЭЦП поддержка</span>
          </div>
        </div>
      </div>
    </footer>
  );
}