// components/rules/rule-builder.tsx
// Custom Rule Builder Interface

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RULE_TEMPLATES, RuleTemplate } from '@/lib/rules-engine/templates';

interface RuleCondition {
  field: string;
  operator: string;
  value: number | string | [number, number];
  period?: string;
}

interface RuleLogic {
  conditions: RuleCondition[];
  logic: 'AND' | 'OR';
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RuleBuilderProps {
  onSave: (rule: { name: string; description: string; logic_json: RuleLogic }) => void;
  onTest: (rule: RuleLogic) => void;
  initialRule?: any;
}

const FIELD_OPTIONS = [
  { value: 'price_change_pct', label: 'Price Change %', unit: '%' },
  { value: 'volume_change_pct', label: 'Volume Change %', unit: '%' },
  { value: 'freight_change_pct', label: 'Freight Change %', unit: '%' },
  { value: 'fx_volatility', label: 'FX Volatility', unit: '%' },
  { value: 'tariff_change_pct', label: 'Tariff Change %', unit: '%' },
  { value: 'unit_price', label: 'Unit Price', unit: 'MYR' },
  { value: 'total_value', label: 'Total Value', unit: 'MYR' }
];

const OPERATOR_OPTIONS = [
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '<=', label: 'Less than or equal' },
  { value: '==', label: 'Equals' },
  { value: '!=', label: 'Not equals' },
  { value: 'BETWEEN', label: 'Between' },
  { value: 'CONTAINS', label: 'Contains' }
];

const PERIOD_OPTIONS = [
  { value: '7_days', label: '7 days' },
  { value: '1_month', label: '1 month' },
  { value: '3_months', label: '3 months' },
  { value: '6_months', label: '6 months' }
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
];

export default function RuleBuilder({ onSave, onTest, initialRule }: RuleBuilderProps) {
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { field: 'price_change_pct', operator: '>', value: 20, period: '1_month' }
  ]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    if (initialRule) {
      setRuleName(initialRule.name || '');
      setRuleDescription(initialRule.description || '');
      setConditions(initialRule.logic_json?.conditions || []);
      setLogic(initialRule.logic_json?.logic || 'AND');
      setSeverity(initialRule.logic_json?.severity || 'medium');
    }
  }, [initialRule]);

  const addCondition = () => {
    setConditions([...conditions, { field: 'price_change_pct', operator: '>', value: 0, period: '1_month' }]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const updateCondition = (index: number, field: keyof RuleCondition, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const loadTemplate = (templateId: string) => {
    const template = RULE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setRuleName(template.name);
      setRuleDescription(template.description);
      setConditions(template.logic_json.conditions);
      setLogic(template.logic_json.logic);
      setSeverity(template.logic_json.severity);
      setSelectedTemplate(templateId);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const ruleLogic: RuleLogic = {
        conditions,
        logic,
        alert_type: 'CUSTOM_PATTERN',
        severity
      };
      
      await onTest(ruleLogic);
    } catch (error) {
      console.error('Error testing rule:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const ruleLogic: RuleLogic = {
      conditions,
      logic,
      alert_type: 'CUSTOM_PATTERN',
      severity
    };

    onSave({
      name: ruleName,
      description: ruleDescription,
      logic_json: ruleLogic
    });
  };

  const getFieldUnit = (field: string) => {
    const fieldOption = FIELD_OPTIONS.find(f => f.value === field);
    return fieldOption?.unit || '';
  };

  const isBetweenOperator = (operator: string) => operator === 'BETWEEN';

  return (
    <div className="space-y-6">
      {/* Rule Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rule Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RULE_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => loadTemplate(template.id)}
            >
              <h4 className="font-medium text-sm">{template.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{template.description}</p>
              <Badge className={`mt-2 ${SEVERITY_OPTIONS.find(s => s.value === template.severity)?.color}`}>
                {template.severity}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Rule Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rule Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rule Name</label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter rule name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={ruleDescription}
              onChange={(e) => setRuleDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe what this rule detects"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Logic Operator</label>
              <select
                value={logic}
                onChange={(e) => setLogic(e.target.value as 'AND' | 'OR')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AND">AND (All conditions must be true)</option>
                <option value="OR">OR (Any condition can be true)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SEVERITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Conditions */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Conditions</h3>
          <Button onClick={addCondition} variant="outline" size="sm">
            + Add Condition
          </Button>
        </div>

        <div className="space-y-4">
          {conditions.map((condition, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium">Condition {index + 1}</h4>
                {conditions.length > 1 && (
                  <Button
                    onClick={() => removeCondition(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Field</label>
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FIELD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Operator</label>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {OPERATOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Value {isBetweenOperator(condition.operator) ? '(Min - Max)' : ''}
                  </label>
                  {isBetweenOperator(condition.operator) ? (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={Array.isArray(condition.value) ? condition.value[0] : 0}
                        onChange={(e) => {
                          const newValue = Array.isArray(condition.value) ? condition.value : [0, 0];
                          updateCondition(index, 'value', [parseFloat(e.target.value) || 0, newValue[1]]);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        value={Array.isArray(condition.value) ? condition.value[1] : 0}
                        onChange={(e) => {
                          const newValue = Array.isArray(condition.value) ? condition.value : [0, 0];
                          updateCondition(index, 'value', [newValue[0], parseFloat(e.target.value) || 0]);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Max"
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={typeof condition.value === 'number' ? condition.value : 0}
                      onChange={(e) => updateCondition(index, 'value', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter value in ${getFieldUnit(condition.field)}`}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Time Period</label>
                  <select
                    value={condition.period || '1_month'}
                    onChange={(e) => updateCondition(index, 'period', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PERIOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Rule Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rule Summary</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm">
            <strong>If</strong> {conditions.map((condition, index) => (
              <span key={index}>
                {condition.field.replace(/_/g, ' ')} {condition.operator} {condition.value}
                {index < conditions.length - 1 && (
                  <span className="font-semibold mx-2">{logic}</span>
                )}
              </span>
            ))}
            <strong className="ml-2">then alert with {severity} severity</strong>
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex space-x-4">
        <Button
          onClick={handleTest}
          disabled={isTesting || !ruleName.trim()}
          variant="outline"
        >
          {isTesting ? 'Testing...' : 'Test Rule'}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!ruleName.trim() || conditions.length === 0}
        >
          Save Rule
        </Button>
      </div>
    </div>
  );
}
