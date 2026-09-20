package pe.edu.utec.vetcare.service;

import pe.edu.utec.vetcare.dto.request.CreateAtencionRequest;
import pe.edu.utec.vetcare.dto.request.UpdateAtencionRequest;
import pe.edu.utec.vetcare.dto.response.AtencionResponse;

import java.util.List;

public interface AtencionService {

    List<AtencionResponse> getAll();

    AtencionResponse getById(Integer id);

    AtencionResponse create(CreateAtencionRequest request);

    AtencionResponse update(Integer id, UpdateAtencionRequest request);

    void delete(Integer id);
}