import { getDashboardStats } from '@/services/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    // تنسيق الأرقام محاسبياً
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);

    const cards = [
        {
            title: 'Total Inventory Value',
            value: formatCurrency(stats.total_cost),
            icon: Package,
            description: 'Total cost of current stock',
            color: 'text-blue-500'
        },
        {
            title: 'Potential Revenue',
            value: formatCurrency(stats.total_revenue),
            icon: DollarSign,
            description: 'Estimated market value',
            color: 'text-green-500'
        },
        {
            title: 'Projected Profit',
            value: formatCurrency(stats.projected_profit),
            icon: TrendingUp,
            description: 'Expected margin on stock',
            color: 'text-orange-500'
        },
    ];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => (
                    <Card key={card.title} className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* الجزء القادم: Charts وجدول آخر الحركات */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4 h-[300px] flex items-center justify-center text-muted-foreground border-dashed">
                    Stock Movement Chart (Coming Soon)
                </Card>
                <Card className="lg:col-span-3 h-[300px] flex items-center justify-center text-muted-foreground border-dashed">
                    Recent Transactions (Coming Soon)
                </Card>
            </div>
        </div>
    );
}