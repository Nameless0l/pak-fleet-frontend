import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

 export const formatCurrency_ = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)} Mds FCFA`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M FCFA`;
    }
    return new Intl.NumberFormat('fr-CM', { 
      style: 'currency', 
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

export default function ForecastCompactWidget() {
  const currentYear = new Date().getFullYear();
  
  const { data: annualReport, isLoading } = useQuery({
    queryKey: ['annual-report', currentYear],
    queryFn: () => reportsService.getAnnualSummary(currentYear)
  });

  
  if (isLoading || !annualReport?.forecast_next_year) {
    return null;
  }

  const forecast = annualReport.forecast_next_year;

  return (
    <div className="bg-white  overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-md p-3">
            <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Budget prévisionnel {forecast.year}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 text-dark-900">
                  {formatCurrency_(forecast.forecast_amount)}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50  px-5 py-3">
        <div className="text-sm">
          <a href="/reports" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
            Voir l'analyse complète
          </a>
        </div>
      </div>
    </div>
  );
}