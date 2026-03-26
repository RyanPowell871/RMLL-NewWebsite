import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Save, Plus, Trash2, MapPin, Shield, Users, UserCheck, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  fetchLeagueContacts,
  updateLeagueContacts,
  type LeagueContacts,
} from '../../services/cms-api';

export function ContactInfoManager() {
  const [contacts, setContacts] = useState<LeagueContacts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeagueContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading league contacts:', error);
      toast.error('Failed to load league contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contacts) return;
    setIsSaving(true);
    try {
      await updateLeagueContacts(contacts);
      toast.success('League contacts saved successfully');
    } catch (error) {
      console.error('Error saving league contacts:', error);
      toast.error('Failed to save league contacts');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !contacts) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading league contacts...
        </CardContent>
      </Card>
    );
  }

  // Executive contacts helpers
  const addExecutive = () => {
    setContacts({
      ...contacts,
      executive_contacts: [...contacts.executive_contacts, { role: '', name: '', email: '' }],
    });
  };
  const removeExecutive = (idx: number) => {
    setContacts({
      ...contacts,
      executive_contacts: contacts.executive_contacts.filter((_, i) => i !== idx),
    });
  };
  const updateExecutive = (idx: number, field: string, value: string) => {
    const updated = [...contacts.executive_contacts];
    updated[idx] = { ...updated[idx], [field]: value };
    setContacts({ ...contacts, executive_contacts: updated });
  };

  // Division commissioners helpers
  const addCommissioner = () => {
    setContacts({
      ...contacts,
      division_commissioners: [...contacts.division_commissioners, { division: '', commissioner: '', email: '' }],
    });
  };
  const removeCommissioner = (idx: number) => {
    setContacts({
      ...contacts,
      division_commissioners: contacts.division_commissioners.filter((_, i) => i !== idx),
    });
  };
  const updateCommissioner = (idx: number, field: string, value: string) => {
    const updated = [...contacts.division_commissioners];
    updated[idx] = { ...updated[idx], [field]: value };
    setContacts({ ...contacts, division_commissioners: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">League Contacts</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage the league address, privacy officer info, executive contacts, and division commissioners.
          These are displayed on the Contact, Privacy Policy, and Terms of Service pages.
        </p>
      </div>

      {/* League Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#013fac]" />
            League Address
          </CardTitle>
          <CardDescription>
            Official league mailing address. Displayed on the Contact page, Privacy Policy, and Terms of Service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input
              id="address_line1"
              value={contacts.address_line1}
              onChange={(e) => setContacts({ ...contacts, address_line1: e.target.value })}
              placeholder="e.g. PO Box 47083 Creekside"
            />
          </div>
          <div>
            <Label htmlFor="address_line2">City, Province, Postal Code</Label>
            <Input
              id="address_line2"
              value={contacts.address_line2}
              onChange={(e) => setContacts({ ...contacts, address_line2: e.target.value })}
              placeholder="e.g. Calgary, Alberta T3P 0B9"
            />
          </div>
          <div>
            <Label htmlFor="general_inquiry_email">General Inquiry Email</Label>
            <Input
              id="general_inquiry_email"
              type="email"
              value={contacts.general_inquiry_email}
              onChange={(e) => setContacts({ ...contacts, general_inquiry_email: e.target.value })}
              placeholder="e.g. info@rmll.ca"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Form Email Forwarding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#013fac]" />
            Contact Form Email Forwarding
          </CardTitle>
          <CardDescription>
            When someone submits the website contact form, a notification email will be forwarded to
            these addresses via Resend. Add one or more recipient email addresses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(contacts.contact_form_recipients || []).map((recipientEmail, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  const updated = [...(contacts.contact_form_recipients || [])];
                  updated[idx] = e.target.value;
                  setContacts({ ...contacts, contact_form_recipients: updated });
                }}
                placeholder="e.g. president@rmll.ca"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const updated = (contacts.contact_form_recipients || []).filter((_, i) => i !== idx);
                  setContacts({ ...contacts, contact_form_recipients: updated });
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setContacts({
                ...contacts,
                contact_form_recipients: [...(contacts.contact_form_recipients || []), ''],
              })
            }
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Recipient
          </Button>
          {(!contacts.contact_form_recipients || contacts.contact_form_recipients.length === 0) && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
              No forwarding recipients configured. Contact form submissions will be stored in the CMS
              but email notifications will not be sent until at least one recipient is added.
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Note: Emails are sent via Resend using the <code>onboarding@resend.dev</code> sender.
            On the free tier, emails can only be delivered to the Resend account owner's email.
            To send to any address, add and verify a custom domain in your Resend dashboard.
          </p>
        </CardContent>
      </Card>

      {/* Privacy Officer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#013fac]" />
            Privacy Officer
          </CardTitle>
          <CardDescription>
            Displayed on the Privacy Policy page as the designated privacy contact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="privacy_officer_title">Title / Role</Label>
            <Input
              id="privacy_officer_title"
              value={contacts.privacy_officer_title}
              onChange={(e) => setContacts({ ...contacts, privacy_officer_title: e.target.value })}
              placeholder="e.g. President of the RMLL"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="privacy_officer_name">Name</Label>
              <Input
                id="privacy_officer_name"
                value={contacts.privacy_officer_name}
                onChange={(e) => setContacts({ ...contacts, privacy_officer_name: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <Label htmlFor="privacy_officer_email">Email</Label>
              <Input
                id="privacy_officer_email"
                type="email"
                value={contacts.privacy_officer_email}
                onChange={(e) => setContacts({ ...contacts, privacy_officer_email: e.target.value })}
                placeholder="e.g. president@rmll.ca"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#013fac]" />
            Executive Contacts
          </CardTitle>
          <CardDescription>
            Displayed on the Contact page. Add or remove executive members as needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.executive_contacts.map((exec, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">Role</Label>
                  <Input
                    value={exec.role}
                    onChange={(e) => updateExecutive(idx, 'role', e.target.value)}
                    placeholder="President"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <Input
                    value={exec.name}
                    onChange={(e) => updateExecutive(idx, 'name', e.target.value)}
                    placeholder="John Doe"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <Input
                    type="email"
                    value={exec.email}
                    onChange={(e) => updateExecutive(idx, 'email', e.target.value)}
                    placeholder="email@example.com"
                    className="h-9"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeExecutive(idx)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-5 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addExecutive} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Executive Contact
          </Button>
        </CardContent>
      </Card>

      {/* Division Commissioners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#013fac]" />
            Division Commissioners
          </CardTitle>
          <CardDescription>
            Displayed on the Contact page. Add, edit, or remove division commissioners.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.division_commissioners.map((comm, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">Division</Label>
                  <Input
                    value={comm.division}
                    onChange={(e) => updateCommissioner(idx, 'division', e.target.value)}
                    placeholder="Senior B"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Commissioner</Label>
                  <Input
                    value={comm.commissioner}
                    onChange={(e) => updateCommissioner(idx, 'commissioner', e.target.value)}
                    placeholder="Jane Doe"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <Input
                    type="email"
                    value={comm.email}
                    onChange={(e) => updateCommissioner(idx, 'email', e.target.value)}
                    placeholder="email@rmll.ca"
                    className="h-9"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCommissioner(idx)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-5 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addCommissioner} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Division Commissioner
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Contacts'}
        </Button>
      </div>
    </div>
  );
}