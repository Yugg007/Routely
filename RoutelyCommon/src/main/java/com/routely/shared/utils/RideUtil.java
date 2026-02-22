package com.routely.shared.utils;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.util.JsonFormat;
import com.routely.shared.model.RideRequest;

public class RideUtil {
    // 1. JSON String -> Proto Object (For Consumers)
    public static RideRequest fromJson(String json) throws InvalidProtocolBufferException {
        if (json == null || json.trim().isEmpty()) {
            return RideRequest.getDefaultInstance();
        }
        RideRequest.Builder builder = RideRequest.newBuilder();
        JsonFormat.parser().ignoringUnknownFields().merge(json, builder);
        return builder.build();
    }

    // 2. Proto Object -> JSON String
    public static String toJson(RideRequest message) throws InvalidProtocolBufferException {
        if (message == null) return "{}";
        return JsonFormat.printer().omittingInsignificantWhitespace().print(message);
    }
    
    public static List<RideRequest> fromJsonList(String json) throws Exception {
        List<RideRequest> list = new ArrayList<>();
        if (json == null || json.isEmpty()) {
            return list;
        }

        ObjectMapper mapper = new ObjectMapper();
		JsonNode rootNode = mapper.readTree(json);

        if (rootNode.isArray()) {
            for (JsonNode node : rootNode) {
                // Convert each node back to string and use our existing method
                list.add(fromJson(node.toString()));
            }
        }
        
        return list;
    }
    
    public static String toJsonList(List<RideRequest> list) throws Exception {
        if (list == null || list.isEmpty()) {
            return "[]";
        }

        ObjectMapper mapper = new ObjectMapper();
        // Create a Jackson ArrayNode to hold our JSON objects
        ArrayNode arrayNode = mapper.createArrayNode();

        for (RideRequest request : list) {
            // Convert Proto to JSON String, then Parse into Jackson Node
            String jsonObject = toJson(request);
            arrayNode.add(mapper.readTree(jsonObject));
        }

        return arrayNode.toString();
    }
}