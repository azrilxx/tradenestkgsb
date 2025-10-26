// app/dashboard/rules/page.tsx
// Custom Rules Management Page

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RuleBuilder from '@/components/rules/rule-builder';

interface Rule {
  id: string;
  name: string;
  description: string;
  logic_json: any;
  active: boolean;
  severity: string;
  created_at: string;
  updated_at: string;
  performance: {
    total_executions: number;
    avg_matches_found: number;
    avg_execution_time_ms: number;
    total_anomalies_created: number;
    last_execution: string | null;
  };
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules');
      const data = await response.json();
      setRules(data.rules || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (ruleData: any) => {
    try {
      const url = editingRule ? '/api/rules' : '/api/rules';
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ruleData,
          ...(editingRule && { id: editingRule.id })
        })
      });

      if (response.ok) {
        await fetchRules();
        setShowBuilder(false);
        setEditingRule(null);
        alert(editingRule ? 'Rule updated successfully!' : 'Rule created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Failed to save rule');
    }
  };

  const handleTestRule = async (ruleLogic: any) => {
    try {
      const response = await fetch('/api/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_logic: ruleLogic })
      });

      const data = await response.json();
      setTestResults(data);
      
      if (data.success) {
        alert(`Test completed! Found ${data.matches.length} matches in ${data.total_products_evaluated} products.`);
      } else {
        alert(`Test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing rule:', error);
      alert('Failed to test rule');
    }
  };

  const handleToggleActive = async (ruleId: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId, active: !currentActive })
      });

      if (response.ok) {
        await fetchRules();
      } else {
        alert('Failed to update rule status');
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/rules?id=${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchRules();
        alert('Rule deleted successfully!');
      } else {
        alert('Failed to delete rule');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Failed to delete rule');
    }
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setShowBuilder(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRules = rules.filter(rule => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return rule.active;
    if (activeFilter === 'inactive') return !rule.active;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading rules...</div>
      </div>
    );
  }

  if (showBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {editingRule ? 'Edit Rule' : 'Create New Rule'}
          </h1>
          <Button
            onClick={() => {
              setShowBuilder(false);
              setEditingRule(null);
            }}
            variant="outline"
          >
            Back to Rules
          </Button>
        </div>

        <RuleBuilder
          onSave={handleSaveRule}
          onTest={handleTestRule}
          initialRule={editingRule}
        />

        {testResults && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{testResults.matches.length}</div>
                <div className="text-sm text-gray-600">Matches Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{testResults.total_products_evaluated}</div>
                <div className="text-sm text-gray-600">Products Evaluated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{testResults.execution_time_ms}ms</div>
                <div className="text-sm text-gray-600">Execution Time</div>
              </div>
            </div>
            
            {testResults.sample_matches && testResults.sample_matches.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sample Matches:</h4>
                <div className="space-y-2">
                  {testResults.sample_matches.map((match: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <strong>Product:</strong> {match.product_id}
                      </div>
                      <div className="text-sm">
                        <strong>Severity:</strong> {match.severity}
                      </div>
                      <div className="text-sm">
                        <strong>Conditions:</strong> {match.matched_conditions.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Custom Rules</h1>
        <Button onClick={() => setShowBuilder(true)}>
          Create New Rule
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex space-x-4">
          <Button
            variant={activeFilter === 'all' ? 'primary' : 'outline'}
            onClick={() => setActiveFilter('all')}
            size="sm"
          >
            All Rules ({rules.length})
          </Button>
          <Button
            variant={activeFilter === 'active' ? 'primary' : 'outline'}
            onClick={() => setActiveFilter('active')}
            size="sm"
          >
            Active ({rules.filter(r => r.active).length})
          </Button>
          <Button
            variant={activeFilter === 'inactive' ? 'primary' : 'outline'}
            onClick={() => setActiveFilter('inactive')}
            size="sm"
          >
            Inactive ({rules.filter(r => !r.active).length})
          </Button>
        </div>
      </Card>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              {rules.length === 0 ? 'No rules created yet' : 'No rules match the current filter'}
            </div>
            {rules.length === 0 && (
              <Button
                onClick={() => setShowBuilder(true)}
                className="mt-4"
              >
                Create Your First Rule
              </Button>
            )}
          </Card>
        ) : (
          filteredRules.map((rule) => (
            <Card key={rule.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{rule.name}</h3>
                    <Badge className={getSeverityColor(rule.severity)}>
                      {rule.severity}
                    </Badge>
                    <Badge variant={rule.active ? 'resolved' : 'default'}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{rule.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-500">Executions</div>
                      <div className="text-lg font-semibold">{rule.performance.total_executions}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Avg Matches</div>
                      <div className="text-lg font-semibold">
                        {rule.performance.avg_matches_found.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Anomalies Created</div>
                      <div className="text-lg font-semibold">{rule.performance.total_anomalies_created}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Last Execution</div>
                      <div className="text-sm">
                        {rule.performance.last_execution 
                          ? new Date(rule.performance.last_execution).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <Button
                    onClick={() => handleEditRule(rule)}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleToggleActive(rule.id, rule.active)}
                    variant="outline"
                    size="sm"
                    className={rule.active ? 'text-orange-600' : 'text-green-600'}
                  >
                    {rule.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onClick={() => handleDeleteRule(rule.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
