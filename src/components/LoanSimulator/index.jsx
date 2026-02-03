import React, { useState } from 'react';
import { DollarSign, Calendar, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';

const LoanSimulator = ({ formData, formatCurrency, formatDate }) => {
  const [showAmortization, setShowAmortization] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  // Gerar tabela de amortização
  const generateAmortizationTable = () => {
    const principal = parseFloat(formData.value) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const periods = parseInt(formData.installments) || 1;
    const installmentValue = formData.installmentValue || 0;
    const startDate = new Date(formData.firstInstallmentDate);

    const frequencyDays = {
      'diaria': 1,
      'semanal': 7,
      'quinzenal': 15,
      'mensal': 30,
      'trimestral': 90
    };

    const daysToAdd = frequencyDays[formData.frequency] || 30;
    const table = [];
    let remainingBalance = formData.totalReceivable || principal;

    for (let i = 1; i <= periods; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (daysToAdd * (i - 1)));

      let interestPortion = 0;
      let principalPortion = 0;

      if (formData.interestType === 'simples') {
        // Juros simples: distribuição igual
        interestPortion = (formData.totalInterest || 0) / periods;
        principalPortion = installmentValue - interestPortion;
      } else {
        // Juros compostos: Price (sistema francês)
        interestPortion = remainingBalance * (rate / 100);
        principalPortion = installmentValue - interestPortion;
      }

      remainingBalance -= principalPortion;

      table.push({
        number: i,
        dueDate: dueDate.toISOString().split('T')[0],
        installmentValue: installmentValue,
        principalPortion: principalPortion,
        interestPortion: interestPortion,
        remainingBalance: Math.max(0, remainingBalance)
      });
    }

    return table;
  };

  const amortizationTable = generateAmortizationTable();

  // Calcular totais
  const totalPrincipal = amortizationTable.reduce((sum, row) => sum + row.principalPortion, 0);
  const totalInterest = amortizationTable.reduce((sum, row) => sum + row.interestPortion, 0);

  return (
    <div className="space-y-6">
      {/* Resumo Visual */}
      <div className="bg-gradient-to-br from-dark-600/20 to-dark-500/20 border border-dark-500/30 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-dark-400" />
          <h3 className="text-lg font-semibold text-white">Simulação do Empréstimo</h3>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-dark p-4 rounded-lg border border-surface-medium">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Valor Emprestado</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(parseFloat(formData.value) || 0)}</p>
          </div>

          <div className="bg-surface-dark p-4 rounded-lg border border-surface-medium">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Juros Total</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{formatCurrency(formData.totalInterest)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formData.interestRate}% {formData.interestType === 'simples' ? 'simples' : 'compostos'}
            </p>
          </div>

          <div className="bg-surface-dark p-4 rounded-lg border border-surface-medium">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Total a Receber</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(formData.totalReceivable)}</p>
          </div>
        </div>

        {/* Informações do Parcelamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-dark/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Número de Parcelas</span>
              <span className="text-lg font-bold text-white">{formData.installments}x</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Valor da Parcela</span>
              <span className="text-lg font-bold text-dark-400">{formatCurrency(formData.installmentValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Frequência</span>
              <span className="text-sm font-medium text-gray-300 capitalize">{formData.frequency}</span>
            </div>
          </div>

          <div className="bg-surface-dark/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Data do Contrato</span>
              <span className="text-sm font-medium text-gray-300">{formatDate(formData.startDate)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Primeira Parcela</span>
              <span className="text-sm font-medium text-gray-300">{formatDate(formData.firstInstallmentDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Última Parcela</span>
              <span className="text-sm font-medium text-gray-300">
                {amortizationTable.length > 0 
                  ? formatDate(amortizationTable[amortizationTable.length - 1].dueDate)
                  : '-'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Alerta de Juros por Atraso */}
        {formData.lateFeeEnabled && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Juros por Atraso Ativado</p>
              <p className="text-xs text-red-300 mt-1">
                Taxa de {formData.lateFeeRate}% ao dia será aplicada sobre parcelas vencidas
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Exemplo: Atraso de 30 dias = {formatCurrency(formData.installmentValue * (parseFloat(formData.lateFeeRate) / 100) * 30)} de juros adicionais
              </p>
            </div>
          </div>
        )}

        {/* Gráfico de Composição */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Composição do Valor Total</span>
            <span className="text-xs text-gray-500">
              Principal: {((parseFloat(formData.value) / formData.totalReceivable) * 100).toFixed(1)}% | 
              Juros: {((formData.totalInterest / formData.totalReceivable) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-surface-dark rounded-full h-4 overflow-hidden flex">
            <div 
              className="bg-blue-500 h-full transition-all"
              style={{ width: `${(parseFloat(formData.value) / formData.totalReceivable) * 100}%` }}
              title={`Principal: ${formatCurrency(parseFloat(formData.value))}`}
            />
            <div 
              className="bg-yellow-500 h-full transition-all"
              style={{ width: `${(formData.totalInterest / formData.totalReceivable) * 100}%` }}
              title={`Juros: ${formatCurrency(formData.totalInterest)}`}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-400">Principal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-400">Juros</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Amortização */}
      <div className="bg-background-tertiary border border-surface-dark rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAmortization(!showAmortization)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-dark transition"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-dark-400" />
            <span className="font-semibold text-white">Tabela de Amortização (SAC/Price)</span>
          </div>
          {showAmortization ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showAmortization && (
          <div className="border-t border-surface-dark">
            <div className="p-4 bg-surface-dark/50">
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Esta tabela mostra como cada parcela será dividida entre pagamento do principal e juros.
                  {formData.interestType === 'simples' 
                    ? ' Juros simples: juros calculados apenas sobre o valor inicial.'
                    : ' Juros compostos: sistema Price - parcelas fixas, juros sobre saldo devedor.'
                  }
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-dark">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nº</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vencimento</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Parcela</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Amortização</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Juros</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Saldo Devedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-dark">
                  {amortizationTable.map((row, index) => (
                    <tr 
                      key={row.number}
                      className="hover:bg-surface-dark/50 transition cursor-pointer"
                      onClick={() => setSelectedInstallment(selectedInstallment === row.number ? null : row.number)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-white">{row.number}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{formatDate(row.dueDate)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-dark-400">
                        {formatCurrency(row.installmentValue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-400">
                        {formatCurrency(row.principalPortion)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-yellow-400">
                        {formatCurrency(row.interestPortion)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-300">
                        {formatCurrency(row.remainingBalance)}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Linha de Totais */}
                  <tr className="bg-surface-dark font-semibold">
                    <td colSpan="2" className="px-4 py-3 text-sm text-white">TOTAIS</td>
                    <td className="px-4 py-3 text-sm text-right text-dark-400">
                      {formatCurrency(formData.totalReceivable)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-blue-400">
                      {formatCurrency(totalPrincipal)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-yellow-400">
                      {formatCurrency(totalInterest)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-400">
                      {formatCurrency(0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Detalhes da parcela selecionada */}
            {selectedInstallment && (
              <div className="p-4 bg-dark-500/10 border-t border-dark-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm font-medium text-white mb-2">
                  Detalhes da Parcela {selectedInstallment}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-gray-400">Amortização</p>
                    <p className="text-blue-400 font-semibold mt-1">
                      {formatCurrency(amortizationTable[selectedInstallment - 1].principalPortion)}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {((amortizationTable[selectedInstallment - 1].principalPortion / formData.installmentValue) * 100).toFixed(1)}% da parcela
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Juros</p>
                    <p className="text-yellow-400 font-semibold mt-1">
                      {formatCurrency(amortizationTable[selectedInstallment - 1].interestPortion)}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {((amortizationTable[selectedInstallment - 1].interestPortion / formData.installmentValue) * 100).toFixed(1)}% da parcela
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Saldo Após</p>
                    <p className="text-gray-300 font-semibold mt-1">
                      {formatCurrency(amortizationTable[selectedInstallment - 1].remainingBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">% Quitado</p>
                    <p className="text-green-400 font-semibold mt-1">
                      {(((formData.totalReceivable - amortizationTable[selectedInstallment - 1].remainingBalance) / formData.totalReceivable) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Informações Adicionais */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-2">Informações Importantes:</p>
            <ul className="space-y-1 text-xs text-blue-200">
              <li>• Esta é uma simulação. Os valores podem sofrer pequenas variações de arredondamento.</li>
              <li>• {formData.interestType === 'simples' 
                ? 'Juros simples: os juros são calculados apenas sobre o valor inicial emprestado.'
                : 'Juros compostos (Price): parcelas fixas, mas a proporção de juros diminui ao longo do tempo.'
              }</li>
              <li>• As datas de vencimento são calculadas automaticamente com base na frequência escolhida.</li>
              {formData.lateFeeEnabled && (
                <li className="text-red-300">• Juros adicionais serão aplicados em caso de atraso no pagamento.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanSimulator;