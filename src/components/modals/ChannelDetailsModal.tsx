"use client";

import { Channel, ChannelMarketplace } from "@/types/supabase2";
import Image from "next/image";

interface ChannelDetailsModalProps {
  channel: Channel | null;
  open: boolean;
  onClose: () => void;
  marketplaces: ChannelMarketplace[];
}

export default function ChannelDetailsModal({
  channel,
  open,
  onClose,
  marketplaces,
}: ChannelDetailsModalProps) {
  if (!open || !channel) return null;

  const channelMarketplaces = marketplaces.filter(
    (marketplace) => marketplace.channel_id === channel.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✖
        </button>

        <h2 className="text-2xl font-bold mb-4">{channel.name}</h2>

        <div className="space-y-2 mb-6">
          <p><strong>Email:</strong> {channel.email ?? "N/A"}</p>
          <p><strong>Telefone:</strong> {channel.phone ?? "N/A"}</p>
          <p><strong>Empresa:</strong> {channel.company_name ?? "N/A"}</p>
          <p><strong>Contato:</strong> {channel.contact_name ?? "N/A"}</p>
          <p><strong>Cidade:</strong> {channel.city ?? "N/A"}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Marketplaces:</h3>
          {channelMarketplaces.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum marketplace encontrado.</p>
          ) : (
            <ul className="space-y-3">
              {channelMarketplaces.map((marketplace) => (
                <li key={marketplace.id} className="flex items-center space-x-3">
                  {marketplace.logo_url && (
                    <Image
                      src={marketplace.logo_url}
                      alt={marketplace.marketplace_name}
                      width={24}
                      height={24}
                      className="object-contain rounded"
                    />
                  )}
                  <span>
                    {marketplace.marketplace_name} ({marketplace.marketplace_code})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}