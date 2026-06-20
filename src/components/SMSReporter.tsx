import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SMSReporter = () => {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !message) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-alert', {
        body: { phone, message }
      });

      if (error) throw error;

      toast({
        title: "SMS Sent",
        description: "Alert has been sent successfully",
      });
      
      setPhone("");
      setMessage("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send SMS",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-secondary/10 rounded-xl">
          <MessageSquare className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">SMS Reporting</h3>
          <p className="text-sm text-muted-foreground">Send alerts without smartphones</p>
        </div>
      </div>

      <form onSubmit={sendSMS} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sms-message">Message</Label>
          <Textarea
            id="sms-message"
            placeholder="Enter health alert message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
          />
        </div>

        <Button type="submit" className="w-full gap-2" disabled={loading}>
          <Send className="w-4 h-4" />
          {loading ? "Sending..." : "Send SMS Alert"}
        </Button>
      </form>
    </Card>
  );
};
