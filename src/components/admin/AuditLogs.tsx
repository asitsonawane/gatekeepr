import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { Download, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuditLog, PaginatedResponse, AuditLogFilter } from '../../lib/types';
import * as api from '../../lib/api';

export function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState<AuditLogFilter>({
        page: 1,
        limit: 20,
        order: 'desc',
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadData();
    }, [filters]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await api.listAuditLogs(filters);
            setLogs(response.data || []);
            setPagination({
                page: response.page,
                limit: response.limit,
                total: response.total,
                totalPages: response.total_pages,
            });
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await api.getAuditCategories();
            setCategories(data || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await api.exportAuditLogs(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export:', error);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('delete') || action.includes('revoke')) return 'destructive';
        if (action.includes('create') || action.includes('grant')) return 'default';
        if (action.includes('update') || action.includes('approve')) return 'secondary';
        return 'outline';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold">Audit Logs</h3>
                    <p className="text-sm text-slate-500">Track all system activities and changes</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={filters.action_category || 'all'}
                                    onValueChange={(v) => setFilters({ ...filters, action_category: v === 'all' ? undefined : v, page: 1 })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Action</Label>
                                <Input
                                    placeholder="Search actions..."
                                    value={filters.action || ''}
                                    onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined, page: 1 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>From Date</Label>
                                <Input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined, page: 1 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>To Date</Label>
                                <Input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined, page: 1 })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setFilters({ page: 1, limit: 20, order: 'desc' })}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Logs Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading audit logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No audit logs found</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{log.actor_email || 'System'}</div>
                                            {log.ip_address && (
                                                <div className="text-xs text-slate-400">{log.ip_address}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionColor(log.action) as any}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {log.target_type && (
                                                <div className="text-sm">
                                                    <span className="text-slate-500">{log.target_type}:</span>{' '}
                                                    {log.target_name || log.target_id}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-slate-500">
                                            {log.details && (
                                                <span title={log.details}>
                                                    {log.details.substring(0, 50)}
                                                    {log.details.length > 50 ? '...' : ''}
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page <= 1}
                            onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="px-3 py-1 text-sm">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
