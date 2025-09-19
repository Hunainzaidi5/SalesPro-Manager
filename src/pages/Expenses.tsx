import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays } from 'date-fns';
import { Plus, Edit, Trash2, DollarSign, TrendingDown, TrendingUp, Calendar, Tag } from 'lucide-react';
import { getExpenses, addExpense, updateExpense, deleteExpense, Expense } from '@/lib/database';

interface ExpenseFormData {
  category: string;
  description: string;
  amount: string;
  date: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Calculate expense statistics
  const calculateExpenseStats = () => {
    if (expenses.length === 0) {
      return {
        totalExpenses: 0,
        avgExpense: 0,
        thisMonthExpenses: 0,
        lastMonthExpenses: 0,
        topCategory: { name: 'N/A', amount: 0, percentage: 0 }
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Calculate total and average
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avgExpense = totalExpenses / expenses.length;

    // Calculate this month's expenses
    const thisMonthExpenses = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate last month's expenses
    const lastMonthExpenses = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate top category
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    let topCategory = { name: 'N/A', amount: 0, percentage: 0 };
    for (const [category, amount] of Object.entries(categoryTotals)) {
      const percentage = (amount / totalExpenses) * 100;
      if (amount > topCategory.amount) {
        topCategory = { name: category, amount, percentage };
      }
    }

    return {
      totalExpenses,
      avgExpense,
      thisMonthExpenses,
      lastMonthExpenses,
      monthOverMonthChange: lastMonthExpenses > 0 
        ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
        : 0,
      topCategory
    };
  };

  const expenseStats = calculateExpenseStats();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        date: new Date(expenseForm.date).toISOString()
      };

      if (editingExpense?.id) {
        await updateExpense(editingExpense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }
      
      resetForm();
      fetchExpenses();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date.split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setExpenseForm({
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(null);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Expense Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Expenses Card */}
        <Card className="border border-black/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{expenseStats.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-black/60">All-time expense total</p>
          </CardContent>
        </Card>
        
        {/* This Month's Expenses */}
        <Card className="border border-black/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{expenseStats.thisMonthExpenses.toFixed(2)}</div>
            <div className="flex items-center text-xs text-black/60">
              {expenseStats.monthOverMonthChange !== 0 && (
                <span className={`flex items-center ${expenseStats.monthOverMonthChange >= 0 ? 'text-black' : 'text-black'}`}>
                  {expenseStats.monthOverMonthChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(expenseStats.monthOverMonthChange).toFixed(1)}% from last month
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Average Expense */}
        <Card className="border border-black/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{expenseStats.avgExpense.toFixed(2)}</div>
            <p className="text-xs text-black/60">Per transaction</p>
          </CardContent>
        </Card>
        
        {/* Top Category */}
        <Card className="border border-black/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Tag className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{expenseStats.topCategory.name}</div>
            <p className="text-xs text-black/60">
              Rs{expenseStats.topCategory.amount.toFixed(2)} • {expenseStats.topCategory.percentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4 border border-black/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Total Expenses</h2>
          <p className="text-2xl font-bold">Rs{totalExpenses.toFixed(2)}</p>
        </div>
      </Card>

      <div className="space-y-4">
        {expenses.map((expense) => (
          <Card key={expense.id} className="p-4 border border-black/10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">{expense.category}</span>
                </div>
                <p className="text-sm text-black/60">{expense.description}</p>
                <p className="text-sm text-black/60">
                  {format(new Date(expense.date), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Rs{expense.amount.toFixed(2)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(expense)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => expense.id && handleDelete(expense.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, description: e.target.value })
                }
                placeholder="Enter description"
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount (Rs)</Label>
              <Input
                id="amount"
                type="number"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={expenseForm.date}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, date: e.target.value })
                }
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingExpense ? 'Update' : 'Add'} Expense
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
